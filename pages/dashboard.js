import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { onValue, ref } from 'firebase/database';
import { auth, db } from '@/firebase';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import MatchmakingCard from '@/components/MatchmakingCard';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUser = () => {};
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      unsubscribeUser();
      if (!currentUser) {
        window.location.href = '/auth';
        return;
      }
      setUser(currentUser);
      unsubscribeUser = onValue(ref(db, `users/${currentUser.uid}`), (snapshot) => {
        setUserStats(snapshot.val() || {});
        setLoading(false);
      });
    });
    return () => {
      unsubscribeAuth();
      unsubscribeUser();
    };
  }, []);

  if (loading) return <div className="app-loading"><span className="waiting-spinner" />Loading your battles…</div>;

  return (
    <div className="user-page">
      <Navbar user={{ ...user, ...userStats }} />
      <main className="mobile-content dashboard-page">
        <section className="welcome-panel">
          <div>
            <span className="eyebrow">WELCOME BACK</span>
            <h1>{userStats?.displayName || 'Player'}</h1>
            <p>Ready for your next real-player battle?</p>
          </div>
          <div className="welcome-avatar">{(userStats?.displayName || 'P').slice(0, 1).toUpperCase()}</div>
        </section>

        <section className="wallet-strip" aria-label="Wallet balances">
          <div>
            <span className="wallet-strip-icon deposit">↓</span>
            <p><small>Deposit chips</small><strong>₹{userStats?.coins || 0}</strong></p>
            <Link href="/wallet">Add</Link>
          </div>
          <div>
            <span className="wallet-strip-icon winning">★</span>
            <p><small>Winning chips</small><strong>₹{userStats?.winningCoins || 0}</strong></p>
            <Link href="/wallet">Withdraw</Link>
          </div>
        </section>

        <section className="notice-banner">
          <span>⚡</span>
          <p><strong>Fast real-player matching</strong><small>Create a challenge and it instantly appears for every online player.</small></p>
        </section>

        <MatchmakingCard userId={user?.uid} />

        <section className="safe-play-note">
          <span>🛡️</span>
          <p><strong>Fair play promise</strong><small>No bots or automatic winners. Every open battle is created by a signed-in player.</small></p>
        </section>
      </main>
      <BottomNav active="play" />
    </div>
  );
}
