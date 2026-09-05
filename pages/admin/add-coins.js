import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavbar from '@/components/AdminNavbar';

export default function AdminAddCoins() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [coins, setCoins] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
    } else {
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddCoins = async (e) => {
    e.preventDefault();
    if (!selectedUser || !coins) {
      setMessage('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/add-coins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          uid: selectedUser,
          coins: parseInt(coins),
          reason: reason || 'Admin added coins'
        })
      });
      const data = await response.json();
      setMessage('Coins added successfully!');
      setSelectedUser('');
      setCoins('');
      setReason('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">🎁 Add Coins to Users</h1>

        <div className="bg-white rounded-lg p-8 shadow-lg">
          <form onSubmit={handleAddCoins} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Select User</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">-- Select User --</option>
                {users.map((user) => (
                  <option key={user.uid} value={user.uid}>
                    {user.displayName} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Number of Coins</label>
              <input
                type="number"
                value={coins}
                onChange={(e) => setCoins(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter number of coins"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Reason (Optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Why are you adding these coins?"
                rows="3"
              />
            </div>

            {message && <p className={`font-semibold ${
              message.includes('Error') ? 'text-red-600' : 'text-green-600'
            }`}>{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Coins'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
