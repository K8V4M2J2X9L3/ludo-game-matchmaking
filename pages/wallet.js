import React, { useState, useEffect } from 'react';
import { auth, db } from '@/firebase';
import { ref, onValue } from 'firebase/database';

export default function Wallet() {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('balance');
  const [amount, setAmount] = useState('');
  const [coins, setCoins] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const walletRef = ref(db, `users/${user.uid}`);
      onValue(walletRef, (snapshot) => {
        const data = snapshot.val();
        setBalance({
          coins: data.coins || 0,
          winningCoins: data.winningCoins || 0,
          totalWinnings: data.totalWinnings || 0
        });
      });

      const transRef = ref(db, `transactions/${user.uid}`);
      onValue(transRef, (snapshot) => {
        if (snapshot.exists()) {
          const trans = Object.entries(snapshot.val()).map(([id, data]) => ({
            id,
            ...data
          }));
          setTransactions(trans.sort((a, b) => b.timestamp - a.timestamp));
        }
      });
    }
  }, []);

  const handleAddCoins = async () => {
    if (!amount || !coins) return;
    setLoading(true);
    try {
      const response = await fetch('/api/wallet/add-coins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await auth.currentUser.getIdToken()}`
        },
        body: JSON.stringify({ amount: parseInt(amount), coins: parseInt(coins) })
      });
      const data = await response.json();
      // Handle Razorpay integration here
      alert('Redirecting to payment gateway...');
      setAmount('');
      setCoins('');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg p-8 shadow-lg">
      <h1 className="text-3xl font-bold mb-6">💳 Wallet</h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-lg p-6">
          <p className="text-sm opacity-90">Playable Coins</p>
          <p className="text-3xl font-bold">{balance?.coins || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-lg p-6">
          <p className="text-sm opacity-90">Winning Coins</p>
          <p className="text-3xl font-bold">{balance?.winningCoins || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-lg p-6">
          <p className="text-sm opacity-90">Total Winnings</p>
          <p className="text-3xl font-bold">₹{balance?.totalWinnings || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('balance')}
          className={`pb-2 font-semibold ${
            activeTab === 'balance'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600'
          }`}
        >
          Balance
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`pb-2 font-semibold ${
            activeTab === 'add'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600'
          }`}
        >
          Add Coins
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2 font-semibold ${
            activeTab === 'history'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600'
          }`}
        >
          History
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'add' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter amount"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Coins</label>
            <input
              type="number"
              value={coins}
              onChange={(e) => setCoins(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter coins"
            />
          </div>
          <button
            onClick={handleAddCoins}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Add Coins'}
          </button>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((trans) => (
                <tr key={trans.id} className="border-b">
                  <td className="px-4 py-2 font-semibold">{trans.type}</td>
                  <td className="px-4 py-2">{trans.amount}</td>
                  <td className="px-4 py-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      trans.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : trans.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {trans.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{new Date(trans.timestamp).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
