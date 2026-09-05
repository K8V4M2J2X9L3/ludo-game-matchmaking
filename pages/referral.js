import React, { useState, useEffect } from 'react';
import { auth, db } from '@/firebase';
import { ref, onValue } from 'firebase/database';

export default function Referral() {
  const [user, setUser] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUser(user);
      const userRef = ref(db, `users/${user.uid}`);
      onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        setUser({ ...user, ...data });
      });
    }
  }, []);

  const handleCopyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth?ref=${user?.referralCode}`;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg p-8 shadow-lg">
      <h1 className="text-3xl font-bold mb-8">🔗 Referral Program</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-lg p-6">
          <p className="text-sm opacity-90">Referral Code</p>
          <p className="text-2xl font-bold">{user?.referralCode}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-lg p-6">
          <p className="text-sm opacity-90">Total Referrals</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-lg p-6">
          <p className="text-sm opacity-90">Referral Rewards</p>
          <p className="text-2xl font-bold">₹{user?.referralRewards || 0}</p>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">📤 Share Your Referral Link</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(referralLink);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">ℹ️ How It Works</h2>
        <ul className="space-y-2 text-gray-700">
          <li>✓ Share your referral code or link with friends</li>
          <li>✓ When they sign up using your code, they become your referral</li>
          <li>✓ You earn ₹10 bonus for each successful referral</li>
          <li>✓ They also get ₹10 bonus coins on their first deposit</li>
          <li>✓ No limit on how many referrals you can make</li>
        </ul>
      </div>
    </div>
  );
}
