import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavbar from '@/components/AdminNavbar';

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
    } else {
      fetchWithdrawals();
    }
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/withdrawal-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setWithdrawals(data);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWithdrawal = async (requestId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`/api/admin/withdrawal-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'approved', adminNotes })
      });
      fetchWithdrawals();
      setSelectedWithdrawal(null);
      setAdminNotes('');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleRejectWithdrawal = async (requestId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`/api/admin/withdrawal-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'rejected', adminNotes })
      });
      fetchWithdrawals();
      setSelectedWithdrawal(null);
      setAdminNotes('');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">💸 Withdrawal Requests</h1>

        <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">User ID</th>
                <th className="px-6 py-3 text-left font-semibold">Amount</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Requested</th>
                <th className="px-6 py-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3">{withdrawal.uid.substring(0, 12)}...</td>
                  <td className="px-6 py-3 font-semibold">₹{withdrawal.amount}</td>
                  <td className="px-6 py-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      withdrawal.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : withdrawal.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {withdrawal.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">{new Date(withdrawal.requestedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => setSelectedWithdrawal(withdrawal)}
                      className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {selectedWithdrawal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">Review Withdrawal</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-gray-600">Amount</p>
                  <p className="text-2xl font-bold">₹{selectedWithdrawal.amount}</p>
                </div>
                <div>
                  <p className="text-gray-600">Account Holder</p>
                  <p className="font-semibold">{selectedWithdrawal.bankDetails.accountHolder}</p>
                </div>
                <div>
                  <p className="text-gray-600">Account Number</p>
                  <p className="font-mono">{selectedWithdrawal.bankDetails.accountNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Admin Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows="3"
                    placeholder="Add any notes..."
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApproveWithdrawal(selectedWithdrawal.id)}
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 font-semibold"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleRejectWithdrawal(selectedWithdrawal.id)}
                  className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 font-semibold"
                >
                  Reject
                </button>
                <button
                  onClick={() => setSelectedWithdrawal(null)}
                  className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
