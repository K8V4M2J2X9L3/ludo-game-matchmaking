import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavbar from '@/components/AdminNavbar';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
    } else {
      fetchStats();
    }
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-500 text-white rounded-lg p-6 shadow-lg">
            <p className="text-sm opacity-90">Total Users</p>
            <p className="text-4xl font-bold">{stats?.totalUsers || 0}</p>
          </div>
          <div className="bg-green-500 text-white rounded-lg p-6 shadow-lg">
            <p className="text-sm opacity-90">Completed Matches</p>
            <p className="text-4xl font-bold">{stats?.completedMatches || 0}</p>
          </div>
          <div className="bg-purple-500 text-white rounded-lg p-6 shadow-lg">
            <p className="text-sm opacity-90">Pending Withdrawals</p>
            <p className="text-4xl font-bold">{stats?.pendingWithdrawals || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-orange-500 text-white rounded-lg p-6 shadow-lg">
            <p className="text-sm opacity-90">Total Winnings Distributed</p>
            <p className="text-3xl font-bold">₹{stats?.totalWinningsDistributed || 0}</p>
          </div>
          <div className="bg-red-500 text-white rounded-lg p-6 shadow-lg">
            <p className="text-sm opacity-90">Active Matches</p>
            <p className="text-3xl font-bold">{stats?.activeMatches || 0}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
