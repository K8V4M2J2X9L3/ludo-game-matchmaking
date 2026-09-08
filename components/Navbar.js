import React, { useState } from 'react';
import Link from 'next/link';
import { auth } from '@/firebase';

export default function Navbar({ user }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = '/auth';
  };

  return (
    <>
      <div className="offer-strip">Play with real players • Win together 🎉</div>
      <header className="site-header">
        <div className="header-inner">
          <button
            type="button"
            className="menu-trigger"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span /><span /><span />
          </button>
          <Link href="/dashboard" className="brand" aria-label="FriendLudo home">
            <span className="brand-die">⚄</span>
            <span><strong>Friend</strong>Ludo<small>PLAY • WIN • REPEAT</small></span>
          </Link>
          <div className="header-actions">
            <Link href="/wallet" className="header-wallet"><span>▣</span> ₹{user?.coins || 0}</Link>
            <Link href="/support" className="guide-button">ⓘ <span>Help</span></Link>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav className="drawer-menu" aria-label="Account menu">
            <Link href="/dashboard">Play battles</Link>
            <Link href="/wallet">Wallet & deposits</Link>
            <Link href="/referral">Refer friends</Link>
            <Link href="/support">Support</Link>
            <Link href="/policies">Legal policies</Link>
            <button type="button" onClick={handleLogout}>Log out</button>
          </nav>
        )}
      </header>
    </>
  );
}
