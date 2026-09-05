import React from 'react';

export default function WalletCard({ user }) {
  return (
    <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4">💰 Quick Balance</h2>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center bg-green-600 bg-opacity-50 p-3 rounded">
          <span>Playable Coins</span>
          <span className="text-2xl font-bold">{user?.coins || 0}</span>
        </div>
        <div className="flex justify-between items-center bg-green-600 bg-opacity-50 p-3 rounded">
          <span>Winning Coins</span>
          <span className="text-2xl font-bold">{user?.winningCoins || 0}</span>
        </div>
      </div>

      <div className="space-y-2">
        <a href="/wallet" className="block w-full bg-white text-green-600 py-2 rounded font-semibold text-center hover:bg-gray-100">
          View Wallet
        </a>
        <a href="/wallet" className="block w-full bg-green-600 py-2 rounded font-semibold text-center hover:bg-green-700">
          Add Coins
        </a>
      </div>
    </div>
  );
}
