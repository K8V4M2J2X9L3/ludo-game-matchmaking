import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminNavbar from '@/components/AdminNavbar';
import { apiRequest } from '@/lib/api';

export default function AdminDeposits() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loadingId, setLoadingId] = useState('');
  const [message, setMessage] = useState('');

  const loadRequests = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    try {
      const data = await apiRequest('/api/admin/deposit-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(data);
    } catch (error) {
      setMessage(error.message);
    }
  }, [router]);

  useEffect(() => {
    loadRequests();
    const interval = window.setInterval(loadRequests, 10000);
    return () => window.clearInterval(interval);
  }, [loadRequests]);

  const processRequest = async (requestId, status) => {
    setLoadingId(requestId);
    setMessage('');
    try {
      const token = localStorage.getItem('adminToken');
      await apiRequest(`/api/admin/deposit-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      setMessage(`Deposit ${status}.`);
      await loadRequests();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoadingId('');
    }
  };

  const visibleRequests = requests.filter((request) => filter === 'all' || request.status === filter);

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div><p className="text-sm font-bold text-purple-700">WALLET CONTROL</p><h1 className="text-3xl font-bold">Deposit approvals</h1></div>
          <select className="px-4 py-2 border rounded-lg" value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All requests</option>
          </select>
        </div>
        {message && <p className="mb-4 p-3 bg-white rounded-lg border">{message}</p>}
        <div className="grid gap-4">
          {visibleRequests.length === 0 ? <div className="bg-white p-10 rounded-xl text-center text-gray-500">No {filter} deposit requests.</div> : visibleRequests.map((request) => (
            <article key={request.id} className="bg-white rounded-xl shadow-sm border p-5 flex flex-wrap items-center gap-5">
              <div className="min-w-48 flex-1">
                <h2 className="font-bold text-lg">{request.userName}</h2>
                <p className="text-sm text-gray-500">{request.userPhone || request.uid}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(request.createdAt).toLocaleString()}</p>
              </div>
              <div><p className="text-xs text-gray-500">PAYMENT REFERENCE</p><strong>{request.paymentReference}</strong></div>
              <div><p className="text-xs text-gray-500">DEPOSIT / COINS</p><strong>₹{request.amount} → {request.coins}</strong></div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${request.status === 'approved' ? 'bg-green-100 text-green-700' : request.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>{request.status}</span>
              {request.status === 'pending' && (
                <div className="flex gap-2">
                  <button disabled={loadingId === request.id} onClick={() => processRequest(request.id, 'approved')} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold">Approve</button>
                  <button disabled={loadingId === request.id} onClick={() => processRequest(request.id, 'rejected')} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-bold">Reject</button>
                </div>
              )}
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
