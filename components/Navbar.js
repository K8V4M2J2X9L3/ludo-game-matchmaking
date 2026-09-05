import React, { useState } from 'react';
import { auth } from '@/firebase';
import Link from 'next/link';

export default function Navbar({ user }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = '/auth';
  };

  return (
    <nav className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-2xl font-bold">
          🎲 Ludo Battle
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="hover:opacity-80">Dashboard</Link>
          <Link href="/wallet" className="hover:opacity-80">Wallet</Link>
          <Link href="/profile" className="hover:opacity-80">Profile</Link>
          <Link href="/support" className="hover:opacity-80">Support</Link>
          <button
            onClick={handleLogout}
            className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 font-semibold"
          >
            Logout
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-2xl"
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-purple-700 py-4 px-4 space-y-2">
          <Link href="/dashboard" className="block py-2 hover:opacity-80">Dashboard</Link>
          <Link href="/wallet" className="block py-2 hover:opacity-80">Wallet</Link>
          <Link href="/profile" className="block py-2 hover:opacity-80">Profile</Link>
          <Link href="/support" className="block py-2 hover:opacity-80">Support</Link>
          <button
            onClick={handleLogout}
            className="block w-full bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 font-semibold"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
