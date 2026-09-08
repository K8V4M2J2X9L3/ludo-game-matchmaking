import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/firebase';
import { onValue, ref } from 'firebase/database';
import { apiRequest } from '@/lib/api';

const quickAmounts = [10, 50, 100, 500];

export default function MatchmakingCard({ userId }) {
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [entryFee, setEntryFee] = useState('50');
  const [userCoins, setUserCoins] = useState(0);
  const [busyMatchId, setBusyMatchId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!userId) return undefined;
    const unsubscribeUser = onValue(ref(db, `users/${userId}/coins`), (snapshot) => {
      setUserCoins(snapshot.val() || 0);
    });
    const unsubscribeMatches = onValue(ref(db, 'matchmaking'), (snapshot) => {
      const liveMatches = snapshot.exists()
        ? Object.entries(snapshot.val()).map(([id, match]) => ({ id, ...match }))
        : [];
      setMatches(liveMatches.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    });
    return () => {
      unsubscribeUser();
      unsubscribeMatches();
    };
  }, [userId]);

  const myMatch = useMemo(
    () => matches.find((match) => match.players?.[userId] && ['waiting', 'ongoing'].includes(match.status)),
    [matches, userId]
  );

  const openMatches = useMemo(
    () => matches.filter((match) => match.status === 'waiting' && match.creatorId !== userId),
    [matches, userId]
  );

  useEffect(() => {
    if (myMatch?.status === 'ongoing') router.push(`/game/${myMatch.id}`);
  }, [myMatch?.id, myMatch?.status, router]);

  const authorizedRequest = async (path, method = 'POST', body) => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Please sign in again');
    return apiRequest(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: body ? JSON.stringify(body) : undefined
    });
  };

  const createMatch = async () => {
    const amount = Number(entryFee);
    if (!Number.isSafeInteger(amount) || amount < 10) {
      setMessage('Enter an amount of at least 10 coins.');
      return;
    }
    setBusyMatchId('create');
    setMessage('');
    try {
      await authorizedRequest('/api/matchmaking/create-match', 'POST', { entryFee: amount });
      setMessage('Battle created. Waiting for a real player to join…');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyMatchId('');
    }
  };

  const joinMatch = async (match) => {
    setBusyMatchId(match.id);
    setMessage('');
    try {
      await authorizedRequest(`/api/matchmaking/join-match/${match.id}`);
      router.push(`/game/${match.id}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyMatchId('');
    }
  };

  const cancelMatch = async () => {
    if (!myMatch) return;
    setBusyMatchId(myMatch.id);
    setMessage('');
    try {
      await authorizedRequest(`/api/matchmaking/cancel-match/${myMatch.id}`);
      setMessage(`${myMatch.entryFee} coins were returned to your wallet.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyMatchId('');
    }
  };

  return (
    <section className="battle-section" aria-labelledby="open-battles-title">
      <div className="battle-create-card">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">REAL PLAYERS ONLY</span>
            <h2>Create a battle</h2>
          </div>
          <span className="balance-pill">◉ {userCoins}</span>
        </div>

        {myMatch?.status === 'waiting' ? (
          <div className="waiting-room" role="status">
            <span className="waiting-spinner" aria-hidden="true" />
            <div>
              <strong>Waiting for an opponent</strong>
              <p>Your ₹{myMatch.entryFee} challenge is visible to every online player.</p>
            </div>
            <button type="button" className="text-button danger" onClick={cancelMatch} disabled={Boolean(busyMatchId)}>
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div className="amount-composer">
              <span>₹</span>
              <input
                type="number"
                min="10"
                step="1"
                inputMode="numeric"
                value={entryFee}
                onChange={(event) => setEntryFee(event.target.value)}
                aria-label="Battle amount"
                placeholder="Enter amount"
              />
              <button type="button" onClick={createMatch} disabled={busyMatchId === 'create'}>
                {busyMatchId === 'create' ? 'Creating…' : 'Create'}
              </button>
            </div>
            <div className="quick-amounts" aria-label="Quick battle amounts">
              {quickAmounts.map((amount) => (
                <button key={amount} type="button" onClick={() => setEntryFee(String(amount))}>₹{amount}</button>
              ))}
            </div>
          </>
        )}

        {message && <p className="inline-message">{message}</p>}
      </div>

      <div className="battle-list-heading">
        <span />
        <h2 id="open-battles-title">🏆 Open Battles</h2>
        <span />
      </div>

      <div className="battle-list" aria-live="polite">
        {openMatches.length === 0 ? (
          <div className="empty-battles">
            <div className="empty-battles-icon">🎲</div>
            <strong>No open battles yet</strong>
            <p>Be the first to create one. Only real player challenges appear here.</p>
          </div>
        ) : openMatches.map((match) => (
          <article className="battle-row" key={match.id}>
            <div className="player-avatar">{(match.creatorName || 'P').slice(0, 1).toUpperCase()}</div>
            <div className="battle-player">
              <strong>{match.creatorName || 'Player'}</strong>
              <span>is waiting for a player</span>
            </div>
            <div className="battle-stake">
              <small>ENTRY</small>
              <strong>₹{match.entryFee}</strong>
            </div>
            <button
              type="button"
              className="play-button"
              onClick={() => joinMatch(match)}
              disabled={Boolean(busyMatchId) || userCoins < match.entryFee}
            >
              {busyMatchId === match.id ? 'Joining…' : 'Play'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
