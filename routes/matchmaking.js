import express from 'express';
import { db as configDb, getActiveDb } from '../server.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const toEntryFee = (value) => {
  const entryFee = Number(value);
  return Number.isSafeInteger(entryFee) && entryFee >= 10 ? entryFee : null;
};

router.post('/create-match', verifyToken, async (req, res) => {
  try {
    const entryFee = toEntryFee(req.body.entryFee);
    if (!entryFee) return res.status(400).json({ error: 'Entry amount must be at least 10 coins' });

    const uid = req.user.uid;
    const database = await getActiveDb();
    const matchId = database.ref('matchmaking').push().key;
    let failure = '';

    const result = await database.ref().transaction((root) => {
      if (!root) return;
      const user = root.users?.[uid];
      if (!user) {
        failure = 'User account was not found';
        return;
      }

      const activeMatch = Object.values(root.matchmaking || {}).find(
        (match) => match?.players?.[uid] && ['waiting', 'ongoing'].includes(match.status)
      );
      if (activeMatch) {
        failure = 'Finish or cancel your current battle first';
        return;
      }
      if ((user.coins || 0) < entryFee) {
        failure = 'Insufficient coins';
        return;
      }

      root.users[uid].coins = (user.coins || 0) - entryFee;
      root.matchmaking = root.matchmaking || {};
      root.matchmaking[matchId] = {
        matchId,
        creatorId: uid,
        creatorName: user.displayName || user.username || 'Player',
        players: {
          [uid]: {
            uid,
            displayName: user.displayName || user.username || 'Player',
            joinedAt: Date.now()
          }
        },
        entryFee,
        status: 'waiting',
        createdAt: Date.now(),
        winnerId: null,
        winAmount: null,
        completedAt: null
      };
      return root;
    });

    if (!result.committed) return res.status(409).json({ error: failure || 'Could not create battle' });
    res.json({ success: true, matchId, match: result.snapshot.child(`matchmaking/${matchId}`).val() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/join-match/:matchId', verifyToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const uid = req.user.uid;
    const database = await getActiveDb();
    let failure = '';

    const result = await database.ref().transaction((root) => {
      if (!root) return;
      const match = root.matchmaking?.[matchId];
      const user = root.users?.[uid];
      if (!match) {
        failure = 'Battle no longer exists';
        return;
      }
      if (match.status !== 'waiting' || Object.keys(match.players || {}).length !== 1) {
        failure = 'Another player already joined this battle';
        return;
      }
      if (match.creatorId === uid || match.players?.[uid]) {
        failure = 'You cannot join your own battle';
        return;
      }
      if (!user || (user.coins || 0) < match.entryFee) {
        failure = 'Insufficient coins';
        return;
      }

      root.users[uid].coins = (user.coins || 0) - match.entryFee;
      match.players[uid] = {
        uid,
        displayName: user.displayName || user.username || 'Player',
        joinedAt: Date.now()
      };
      match.opponentId = uid;
      match.opponentName = user.displayName || user.username || 'Player';
      match.status = 'ongoing';
      match.startedAt = Date.now();
      match.currentPlayer = match.creatorId;
      return root;
    });

    if (!result.committed) return res.status(409).json({ error: failure || 'Could not join battle' });
    res.json({ success: true, match: result.snapshot.child(`matchmaking/${matchId}`).val() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/cancel-match/:matchId', verifyToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const uid = req.user.uid;
    const database = await getActiveDb();
    let failure = '';

    const result = await database.ref().transaction((root) => {
      if (!root) return;
      const match = root.matchmaking?.[matchId];
      if (!match || match.creatorId !== uid || match.status !== 'waiting') {
        failure = 'Only the creator can cancel a waiting battle';
        return;
      }

      root.users[uid].coins = (root.users[uid].coins || 0) + match.entryFee;
      match.status = 'cancelled';
      match.cancelledAt = Date.now();
      return root;
    });

    if (!result.committed) return res.status(409).json({ error: failure || 'Could not cancel battle' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/available-matches', verifyToken, async (req, res) => {
  try {
    const database = await getActiveDb();
    const snapshot = await database.ref('matchmaking').orderByChild('status').equalTo('waiting').limitToFirst(50).get();
    const matches = snapshot.exists()
      ? Object.entries(snapshot.val()).map(([id, match]) => ({ id, ...match }))
      : [];
    res.json(matches.filter((match) => match.creatorId !== req.user.uid));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/end-match/:matchId', verifyToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const database = await getActiveDb();
    const matchSnapshot = await database.ref(`matchmaking/${matchId}`).get();
    const match = matchSnapshot.val();
    const winnerId = Object.keys(match?.players || {}).find((uid) => uid !== req.user.uid);

    if (!match || !match.players?.[req.user.uid] || !winnerId) {
      return res.status(403).json({ error: 'Invalid match result' });
    }
    if (match.status !== 'ongoing') return res.status(409).json({ error: 'Battle is not active' });

    const settingsSnapshot = await configDb.ref('admin/settings').get();
    const settings = settingsSnapshot.val() || { winnerPayoutPercentage: 90 };
    const winAmount = Math.floor((match.entryFee * 2 * settings.winnerPayoutPercentage) / 100);

    const result = await database.ref().transaction((root) => {
      const currentMatch = root?.matchmaking?.[matchId];
      if (!currentMatch || currentMatch.status !== 'ongoing') return;
      const winner = root.users?.[winnerId];
      if (!winner) return;

      winner.coins = (winner.coins || 0) + winAmount;
      winner.winningCoins = (winner.winningCoins || 0) + winAmount;
      winner.totalWinnings = (winner.totalWinnings || 0) + winAmount;
      winner.stats = winner.stats || {};
      winner.stats.totalWins = (winner.stats.totalWins || 0) + 1;
      for (const playerId of Object.keys(currentMatch.players)) {
        const player = root.users[playerId];
        if (player) {
          player.stats = player.stats || {};
          player.stats.totalMatches = (player.stats.totalMatches || 0) + 1;
        }
      }
      Object.assign(currentMatch, {
        status: 'completed',
        winnerId,
        winAmount,
        completedAt: Date.now()
      });
      return root;
    });

    if (!result.committed) return res.status(409).json({ error: 'Battle was already completed' });
    res.json({ success: true, winAmount });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
