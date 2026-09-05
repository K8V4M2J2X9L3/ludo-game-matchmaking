import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavbar from '@/components/AdminNavbar';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    razorpayKey: '',
    razorpaySecret: '',
    zappiApiKey: '',
    zappiEnabled: false,
    coinAdditionEnabled: false,
    winnerPayoutPercentage: 90,
    platformCommissionPercentage: 10,
    minimumWithdrawal: 100,
    gstPercentage: 18
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
    } else {
      fetchSettings();
    }
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setSettings({ ...settings, ...data });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      const data = await response.json();
      setMessage('Settings updated successfully!');
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
        <h1 className="text-3xl font-bold mb-8">⚙️ Admin Settings</h1>

        <div className="bg-white rounded-lg p-8 shadow-lg space-y-6">
          {/* Payment Gateway Settings */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-bold mb-4">💳 Payment Gateway (Razorpay)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Razorpay Key ID</label>
                <input
                  type="text"
                  value={settings.razorpayKey}
                  onChange={(e) => setSettings({ ...settings, razorpayKey: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter Razorpay Key ID"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Razorpay Key Secret</label>
                <input
                  type="password"
                  value={settings.razorpaySecret}
                  onChange={(e) => setSettings({ ...settings, razorpaySecret: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter Razorpay Key Secret"
                />
              </div>
            </div>
          </div>

          {/* Zappi Settings */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-bold mb-4">🎁 Zappi API Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.zappiEnabled}
                  onChange={(e) => setSettings({ ...settings, zappiEnabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="ml-2 font-semibold">Enable Zappi API</label>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Zappi API Key</label>
                <input
                  type="password"
                  value={settings.zappiApiKey}
                  onChange={(e) => setSettings({ ...settings, zappiApiKey: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter Zappi API Key"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.coinAdditionEnabled}
                  onChange={(e) => setSettings({ ...settings, coinAdditionEnabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="ml-2 font-semibold">Enable Manual Coin Addition</label>
              </div>
            </div>
          </div>

          {/* Game Settings */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-bold mb-4">🎮 Game Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Winner Payout Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.winnerPayoutPercentage}
                  onChange={(e) => setSettings({ ...settings, winnerPayoutPercentage: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-sm text-gray-600 mt-1">If 90%, winner gets 90% of total pot, platform keeps 10%</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Platform Commission (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.platformCommissionPercentage}
                  onChange={(e) => setSettings({ ...settings, platformCommissionPercentage: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Withdrawal Settings */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-bold mb-4">🏦 Withdrawal Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Minimum Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={settings.minimumWithdrawal}
                  onChange={(e) => setSettings({ ...settings, minimumWithdrawal: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Tax Settings */}
          <div className="pb-6">
            <h2 className="text-xl font-bold mb-4">💰 Tax Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">GST Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.gstPercentage}
                  onChange={(e) => setSettings({ ...settings, gstPercentage: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {message && <p className="text-green-600 font-semibold">{message}</p>}

          <button
            onClick={handleSaveSettings}
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </main>
    </div>
  );
}
