import React, { useState, useEffect } from 'react';
import { auth, db } from '@/firebase';
import { ref, onValue } from 'firebase/database';
import Link from 'next/link';

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600">
      {/* Navigation */}
      <nav className="bg-black bg-opacity-50 text-white py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">🎲 Ludo Battle</h1>
          <div className="space-x-4">
            {user ? (
              <>
                <Link href="/dashboard" className="hover:opacity-80">
                  Dashboard
                </Link>
                <button
                  onClick={() => auth.signOut()}
                  className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/auth" className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700">
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-white">
        <h2 className="text-6xl font-bold mb-6">Play Ludo & Win Real Money</h2>
        <p className="text-2xl mb-8 opacity-90">Challenge players worldwide in live matches and earn coins</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white bg-opacity-20 p-8 rounded-lg backdrop-blur-lg">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="text-2xl font-bold mb-2">Live Matchmaking</h3>
            <p>Get matched with real players instantly</p>
          </div>
          <div className="bg-white bg-opacity-20 p-8 rounded-lg backdrop-blur-lg">
            <div className="text-5xl mb-4">💰</div>
            <h3 className="text-2xl font-bold mb-2">Win Coins</h3>
            <p>Earn coins by winning matches</p>
          </div>
          <div className="bg-white bg-opacity-20 p-8 rounded-lg backdrop-blur-lg">
            <div className="text-5xl mb-4">🏦</div>
            <h3 className="text-2xl font-bold mb-2">Cash Withdraw</h3>
            <p>Convert coins to real money</p>
          </div>
        </div>

        {user ? (
          <Link
            href="/dashboard"
            className="inline-block bg-white text-purple-600 px-12 py-4 rounded-lg font-bold text-xl hover:bg-gray-100 transition"
          >
            Go to Dashboard
          </Link>
        ) : (
          <Link
            href="/auth"
            className="inline-block bg-white text-purple-600 px-12 py-4 rounded-lg font-bold text-xl hover:bg-gray-100 transition"
          >
            Get Started Now
          </Link>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-black bg-opacity-50 text-white py-8 mt-20">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-bold mb-4">About</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link href="#">About Us</Link></li>
              <li><Link href="#">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link href="/policies#privacy">Privacy Policy</Link></li>
              <li><Link href="/policies#terms">Terms & Conditions</Link></li>
              <li><Link href="/policies#refund">Refund Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link href="/support">Help Center</Link></li>
              <li><Link href="/support">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Follow Us</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link href="#">Facebook</Link></li>
              <li><Link href="#">Twitter</Link></li>
              <li><Link href="#">Instagram</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm opacity-60">
          <p>&copy; 2024 Ludo Battle. All rights reserved. | Admin Password: Bankai$1000</p>
        </div>
      </footer>
    </div>
  );
}
