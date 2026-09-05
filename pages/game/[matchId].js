import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/firebase';
import { ref, onValue, update } from 'firebase/database';
import { io } from 'socket.io-client';

export default function Game() {
  const router = useRouter();
  const { matchId } = router.query;
  const [match, setMatch] = useState(null);
  const [gameState, setGameState] = useState({
    board: Array(52).fill(null),
    players: {},
    currentPlayer: null,
    diceRoll: 0,
    status: 'waiting'
  });
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;

    // Connect to socket
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    // Fetch match data
    const matchRef = ref(db, `matchmaking/${matchId}`);
    onValue(matchRef, (snapshot) => {
      const data = snapshot.val();
      setMatch(data);
      setLoading(false);

      // Initialize game state
      if (data.status === 'ongoing') {
        setGameState(prev => ({
          ...prev,
          status: 'playing'
        }));
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [matchId]);

  const rollDice = () => {
    const roll = Math.floor(Math.random() * 6) + 1;
    setGameState(prev => ({
      ...prev,
      diceRoll: roll
    }));

    // Broadcast to opponent
    if (socket) {
      socket.emit('game-move', {
        matchId,
        playerId: auth.currentUser.uid,
        action: 'roll',
        value: roll
      });
    }
  };

  const handleMovePiece = (pieceIndex) => {
    // Game logic for moving pieces
    setGameState(prev => ({
      ...prev,
      diceRoll: 0
    }));

    if (socket) {
      socket.emit('game-move', {
        matchId,
        playerId: auth.currentUser.uid,
        action: 'move',
        pieceIndex
      });
    }
  };

  const handleGameEnd = async (winnerId) => {
    if (socket) {
      socket.emit('game-end', {
        matchId,
        winnerId
      });
    }

    // Update match result in database
    const matchRef = ref(db, `matchmaking/${matchId}`);
    await update(matchRef, {
      winnerId,
      status: 'completed',
      completedAt: Date.now()
    });

    // Redirect to results
    setTimeout(() => {
      router.push(`/game-results/${matchId}`);
    }, 2000);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading game...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-green-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Game Header */}
        <div className="bg-white rounded-lg p-4 shadow-lg mb-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">🎲 Ludo Game</h1>
            <div className="text-lg font-semibold">Match ID: {matchId?.substring(0, 8)}...</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Game Board */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg p-6 shadow-lg" style={{
              backgroundImage: 'linear-gradient(45deg, #ffeaa7 25%, transparent 25%)',
              backgroundSize: '60px 60px'
            }}>
              <div className="w-full aspect-square bg-yellow-50 rounded-lg border-4 border-gray-800 relative">
                {/* Ludo Board Grid */}
                <div className="grid grid-cols-4 gap-0 w-full h-full p-4">
                  {/* Home Zones */}
                  {['Red', 'Yellow', 'Blue', 'Green'].map((color, idx) => (
                    <div key={idx} className={`bg-${color.toLowerCase()}-200 border border-gray-400 rounded flex items-center justify-center`}>
                      <div className="text-center">
                        <p className="font-semibold text-sm">{color}</p>
                        <p className="text-2xl">🎮</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Center Star */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl">
                  ⭐
                </div>
              </div>
            </div>
          </div>

          {/* Game Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-lg space-y-4">
              {/* Dice */}
              <div className="text-center">
                <p className="font-semibold mb-2">Dice Roll</p>
                <div className="bg-gradient-to-br from-red-400 to-red-600 text-white text-6xl font-bold rounded-lg p-6 aspect-square flex items-center justify-center mb-4">
                  {gameState.diceRoll || '?'}
                </div>
                <button
                  onClick={rollDice}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700"
                >
                  🎲 Roll Dice
                </button>
              </div>

              {/* Players Info */}
              <div className="border-t pt-4">
                <p className="font-semibold mb-3">Players</p>
                {match?.players && Object.entries(match.players).map(([uid, player]) => (
                  <div key={uid} className="bg-gray-50 p-3 rounded mb-2">
                    <p className="font-semibold">{player.displayName}</p>
                    <p className="text-sm text-gray-600">Joined {new Date(player.joinedAt).toLocaleTimeString()}</p>
                  </div>
                ))}
              </div>

              {/* Game Info */}
              <div className="border-t pt-4 text-sm">
                <p><strong>Entry Fee:</strong> {match?.entryFee} Coins</p>
                <p><strong>Status:</strong> {gameState.status}</p>
                {match?.winAmount && (
                  <p><strong>Prize Pool:</strong> {match?.entryFee * Object.keys(match?.players || {}).length} Coins</p>
                )}
              </div>

              {/* End Game */}
              <button
                onClick={() => handleGameEnd(auth.currentUser.uid)}
                className="w-full bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700"
              >
                🏁 End Game
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
