import React from 'react';
import Link from 'next/link';

export default function AdminNavbar() {
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
  };

  return (
    <nav className="bg-red-700 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/admin/dashboard" className="text-2xl font-bold">
          🔐 Admin Panel
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/admin/dashboard" className="hover:opacity-80">Dashboard</Link>
          <Link href="/admin/settings" className="hover:opacity-80">Settings</Link>
          <Link href="/admin/withdrawals" className="hover:opacity-80">Withdrawals</Link>
          <Link href="/admin/policies" className="hover:opacity-80">Policies</Link>
          <Link href="/admin/add-coins" className="hover:opacity-80">Add Coins</Link>
          <button
            onClick={handleLogout}
            className="bg-white text-red-700 px-4 py-2 rounded font-semibold hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
