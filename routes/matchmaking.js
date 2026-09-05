import express from 'express';
import { db } from '../server.js';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Create match pool
router.post('/create-match', verifyToken, async (req, res) => {
  try {
    const { entryFee } = req.body;
    const uid = req.user.uid;

    // Check user coins
    const userRef = db.ref(`users/${uid}`);
    const userSnapshot = await userRef.get();
    const user = userSnapshot.val();

    if (user.coins < entryFee) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }

    // Deduct coins
    await userRef.update({
      coins: user.coins - entryFee
    });

    // Create match
    const matchId = uuidv4();
    const match = {
      matchId,
      players: {
        [uid]: {
          uid,
          displayName: user.displayName,
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

    await db.ref(`matchmaking/${matchId}`).set(match);

    res.json({ success: true, matchId, match });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Join match
router.post('/join-match/:matchId', verifyToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const uid = req.user.uid;

    const matchRef = db.ref(`matchmaking/${matchId}`);
    const matchSnapshot = await matchRef.get();
    const match = matchSnapshot.val();

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.status !== 'waiting') {
      return res.status(400).json({ error: 'Match not available' });
    }

    // Check user coins
    const userRef = db.ref(`users/${uid}`);
    const userSnapshot = await userRef.get();
    const user = userSnapshot.val();

    if (user.coins < match.entryFee) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }

    // Deduct coins
    await userRef.update({
      coins: user.coins - match.entryFee
    });

    // Add player to match
    match.players[uid] = {
      uid,
      displayName: user.displayName,
      joinedAt: Date.now()
    };

    // Update match status to ongoing
    match.status = 'ongoing';
    await matchRef.update(match);

    res.json({ success: true, match });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get available matches
router.get('/available-matches', verifyToken, async (req, res) => {
  try {
    const matchesRef = db.ref('matchmaking').orderByChild('status').equalTo('waiting');
    const snapshot = await matchesRef.limitToFirst(50).get();

    if (!snapshot.exists()) {
      return res.json([]);
    }

    const matches = Object.values(snapshot.val());
    res.json(matches);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// End match and declare winner
router.post('/end-match/:matchId', verifyToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { winnerId } = req.body;

    const matchRef = db.ref(`matchmaking/${matchId}`);
    const matchSnapshot = await matchRef.get();
    const match = matchSnapshot.val();

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Get admin settings
    const adminSettingsRef = db.ref('admin/settings');
    const settingsSnapshot = await adminSettingsRef.get();
    const settings = settingsSnapshot.val() || { winnerPayoutPercentage: 90 };

    const totalPot = match.entryFee * Object.keys(match.players).length;
    const winAmount = Math.floor((totalPot * settings.winnerPayoutPercentage) / 100);

    // Update winner coins
    const winnerRef = db.ref(`users/${winnerId}`);
    const winnerSnapshot = await winnerRef.get();
    const winner = winnerSnapshot.val();

    await winnerRef.update({
      coins: winner.coins + winAmount,
      winningCoins: (winner.winningCoins || 0) + winAmount,
      totalWinnings: (winner.totalWinnings || 0) + winAmount,
      'stats/totalWins': (winner.stats?.totalWins || 0) + 1,
      'stats/totalMatches': (winner.stats?.totalMatches || 0) + 1
    });

    // Update all players' total matches
    for (const uid of Object.keys(match.players)) {
      if (uid !== winnerId) {
        const playerRef = db.ref(`users/${uid}`);
        const playerSnapshot = await playerRef.get();
        const player = playerSnapshot.val();
        await playerRef.update({
          'stats/totalMatches': (player.stats?.totalMatches || 0) + 1
        });
      }
    }

    // Update match
    match.status = 'completed';
    match.winnerId = winnerId;
    match.winAmount = winAmount;
    match.completedAt = Date.now();

    await matchRef.update(match);

    // Record transaction
    const transactionId = uuidv4();
    await db.ref(`transactions/${winnerId}/${transactionId}`).set({
      uid: winnerId,
      type: 'win',
      amount: winAmount,
      status: 'completed',
      description: `Won match ${matchId}`,
      timestamp: Date.now()
    });

    res.json({ success: true, match, winAmount });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
