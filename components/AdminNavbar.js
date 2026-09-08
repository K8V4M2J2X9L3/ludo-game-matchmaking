import React from 'react';
import Link from 'next/link';

export default function AdminNavbar() {
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
  };

  return (
    <nav className="admin-nav">
      <div className="admin-nav-inner">
        <Link href="/admin/dashboard" className="admin-brand">
          🔐 Admin Panel
        </Link>

        <div className="admin-links">
          <Link href="/admin/dashboard">Dashboard</Link>
          <Link href="/admin/settings">Settings</Link>
          <Link href="/admin/withdrawals">Withdrawals</Link>
          <Link href="/admin/deposits">Deposits</Link>
          <Link href="/admin/policies">Policies</Link>
          <Link href="/admin/add-coins">Add Coins</Link>
          <button
            onClick={handleLogout}
            type="button"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
