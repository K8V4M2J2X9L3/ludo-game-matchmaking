import React, { useState, useEffect } from 'react';
import { auth, db } from '@/firebase';
import { ref, onValue, push, update } from 'firebase/database';

export default function MatchmakingCard({ userId }) {
  const [matches, setMatches] = useState([]);
  const [selectedEntryFee, setSelectedEntryFee] = useState(10);
  const [loading, setLoading] = useState(false);
  const [userCoins, setUserCoins] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const userRef = ref(db, `users/${user.uid}`);
      onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        setUserCoins(data.coins || 0);
      });

      const matchesRef = ref(db, 'matchmaking');
      onValue(matchesRef, (snapshot) => {
        if (snapshot.exists()) {
          const allMatches = Object.entries(snapshot.val())
            .filter(([_, match]) => match.status === 'waiting')
            .map(([id, match]) => ({ id, ...match }));
          setMatches(allMatches);
        }
      });
    }
  }, []);

  const handleCreateMatch = async () => {
    if (userCoins < selectedEntryFee) {
      alert('Insufficient coins!');
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      const matchRef = ref(db, 'matchmaking');
      const newMatchRef = await push(matchRef, {
        players: {
          [user.uid]: {
            uid: user.uid,
            displayName: user.displayName || 'Player',
            joinedAt: Date.now()
          }
        },
        entryFee: selectedEntryFee,
        status: 'waiting',
        createdAt: Date.now()
      });

      // Update user coins
      const userRef = ref(db, `users/${user.uid}`);
      await update(userRef, {
        coins: userCoins - selectedEntryFee
      });

      alert('Match created! Waiting for opponent...');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMatch = async (matchId) => {
    if (userCoins < selectedEntryFee) {
      alert('Insufficient coins!');
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      const matchRef = ref(db, `matchmaking/${matchId}`);
      const snapshot = await new Promise((resolve) => {
        onValue(matchRef, resolve, { onlyOnce: true });
      });
      const match = snapshot.val();

      match.players[user.uid] = {
        uid: user.uid,
        displayName: user.displayName || 'Player',
        joinedAt: Date.now()
      };
      match.status = 'ongoing';

      await update(matchRef, match);

      // Update user coins
      const userRef = ref(db, `users/${user.uid}`);
      await update(userRef, {
        coins: userCoins - match.entryFee
      });

      alert('Joined match! Starting game...');
      // Redirect to game
      window.location.href = `/game/${matchId}`;
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <h2 className="text-xl font-bold mb-4">🎮 Play Ludo</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Entry Fee (Coins)</label>
          <select
            value={selectedEntryFee}
            onChange={(e) => setSelectedEntryFee(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value={10}>10 Coins</option>
            <option value={25}>25 Coins</option>
            <option value={50}>50 Coins</option>
            <option value={100}>100 Coins</option>
          </select>
        </div>

        <p className="text-sm text-gray-600">Your Coins: <strong>{userCoins}</strong></p>

        <button
          onClick={handleCreateMatch}
          disabled={loading || userCoins < selectedEntryFee}
          className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Match'}
        </button>
      </div>

      {/* Available Matches */}
      {matches.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold mb-4">Available Matches</h3>
          <div className="space-y-2">
            {matches.map((match) => (
              <div key={match.id} className="bg-gray-50 p-3 rounded flex justify-between items-center">
                <div>
                  <p className="font-semibold">Entry: {match.entryFee} Coins</p>
                  <p className="text-sm text-gray-600">Players: {Object.keys(match.players).length}/2</p>
                </div>
                <button
                  onClick={() => handleJoinMatch(match.id)}
                  disabled={loading || userCoins < match.entryFee}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
