import React, { useState, useEffect } from 'react';
import { auth, db } from '@/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import Navbar from '@/components/Navbar';
import WalletCard from '@/components/WalletCard';
import MatchmakingCard from '@/components/MatchmakingCard';
import Link from 'next/link';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = ref(db, `users/${currentUser.uid}`);
        onValue(userRef, (snapshot) => {
          setUserStats(snapshot.val());
          setLoading(false);
        });
      } else {
        window.location.href = '/auth';
      }
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-8 mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome, {userStats?.displayName}!</h1>
          <p className="text-lg opacity-90">Play Ludo, Win Coins, Earn Real Money</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow">
            <p className="text-gray-600 text-sm">Coins Balance</p>
            <p className="text-3xl font-bold text-purple-600">{userStats?.coins || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <p className="text-gray-600 text-sm">Winning Coins</p>
            <p className="text-3xl font-bold text-green-600">{userStats?.winningCoins || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <p className="text-gray-600 text-sm">Total Wins</p>
            <p className="text-3xl font-bold text-blue-600">{userStats?.stats?.totalWins || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <p className="text-gray-600 text-sm">Win Rate</p>
            <p className="text-3xl font-bold text-orange-600">
              {userStats?.stats?.totalMatches > 0
                ? Math.round(
                    (userStats?.stats?.totalWins / userStats?.stats?.totalMatches) * 100
                  )
                : 0}
              %
            </p>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <WalletCard user={userStats} />
          <MatchmakingCard userId={user?.uid} />
          <div className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-xl font-bold mb-4">Quick Links</h2>
            <div className="space-y-2">
              <Link href="/profile" className="block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                👤 Profile
              </Link>
              <Link href="/referral" className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                🔗 Referral
              </Link>
              <Link href="/wallet" className="block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                💳 Wallet
              </Link>
              <Link href="/support" className="block px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">
                📞 Support
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
