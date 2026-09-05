import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/firebase';
import { ref, onValue } from 'firebase/database';
import Link from 'next/link';

export default function GameResults() {
  const router = useRouter();
  const { matchId } = router.query;
  const [match, setMatch] = useState(null);
  const [winnerData, setWinnerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;

    const matchRef = ref(db, `matchmaking/${matchId}`);
    onValue(matchRef, (snapshot) => {
      const data = snapshot.val();
      setMatch(data);

      if (data?.winnerId) {
        const winnerRef = ref(db, `users/${data.winnerId}`);
        onValue(winnerRef, (winnerSnapshot) => {
          setWinnerData(winnerSnapshot.val());
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, [matchId]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading results...</div>;
  }

  const isWinner = auth.currentUser?.uid === match?.winnerId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
        {isWinner ? (
          <>
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold text-green-600 mb-2">You Won!</h1>
            <p className="text-lg text-gray-700 mb-6">Congratulations!</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">😢</div>
            <h1 className="text-3xl font-bold text-red-600 mb-2">Game Over</h1>
            <p className="text-lg text-gray-700 mb-6">Better luck next time!</p>
          </>
        )}

        {/* Match Details */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left space-y-3">
          <div>
            <p className="text-sm text-gray-600">Winner</p>
            <p className="font-bold text-lg">{winnerData?.displayName || 'Loading...'}</p>
          </div>
          {isWinner && match?.winAmount && (
            <div className="border-t pt-3">
              <p className="text-sm text-gray-600">You Won</p>
              <p className="font-bold text-2xl text-green-600">+{match.winAmount} Coins</p>
            </div>
          )}
          <div className="border-t pt-3">
            <p className="text-sm text-gray-600">Match Duration</p>
            <p className="font-semibold">
              {match?.completedAt && match?.createdAt
                ? Math.round((match.completedAt - match.createdAt) / 1000 / 60)
                : 0} minutes
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Link href="/dashboard" className="block w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700">
            Back to Dashboard
          </Link>
          <Link href="/dashboard" className="block w-full bg-gray-400 text-white py-3 rounded-lg font-bold hover:bg-gray-500">
            Play Again
          </Link>
        </div>
      </div>
    </div>
  );
}
