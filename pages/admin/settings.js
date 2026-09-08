import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavbar from '@/components/AdminNavbar';
import { apiUrl } from '@/lib/api';

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
    gstPercentage: 18,
    depositCoinRate: 1,
    databaseConfig: {
      activeDatabaseId: '',
      databases: []
    }
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
      const response = await fetch(apiUrl('/api/admin/settings'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setSettings((current) => ({
        ...current,
        ...data,
        databaseConfig: {
          ...current.databaseConfig,
          ...(data.databaseConfig || {}),
          databases: Array.isArray(data.databaseConfig?.databases)
            ? data.databaseConfig.databases
            : Object.values(data.databaseConfig?.databases || {})
        }
      }));
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(apiUrl('/api/admin/settings'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save settings');
      setMessage('Settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateDatabase = (index, field, value) => {
    setSettings((current) => ({
      ...current,
      databaseConfig: {
        ...current.databaseConfig,
        databases: current.databaseConfig.databases.map((database, databaseIndex) => (
          databaseIndex === index ? { ...database, [field]: value } : database
        ))
      }
    }));
  };

  const addDatabase = () => {
    const id = `database-${Date.now()}`;
    setSettings((current) => ({
      ...current,
      databaseConfig: {
        activeDatabaseId: current.databaseConfig.activeDatabaseId || id,
        databases: [...current.databaseConfig.databases, { id, label: 'New database', databaseURL: '', enabled: true }]
      }
    }));
  };

  const removeDatabase = (index) => {
    setSettings((current) => {
      const removed = current.databaseConfig.databases[index];
      const databases = current.databaseConfig.databases.filter((_, databaseIndex) => databaseIndex !== index);
      return {
        ...current,
        databaseConfig: {
          databases,
          activeDatabaseId: current.databaseConfig.activeDatabaseId === removed.id
            ? (databases[0]?.id || '')
            : current.databaseConfig.activeDatabaseId
        }
      };
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">⚙️ Admin Settings</h1>

        <div className="bg-white rounded-lg p-8 shadow-lg space-y-6">
          <div className="border-b pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold">🔥 Realtime Database Routing</h2>
                <p className="text-sm text-gray-600 mt-1">Add multiple Firebase database instances and choose the one used by players, matches, wallets, and deposits.</p>
              </div>
              <button type="button" onClick={addDatabase} className="self-start px-4 py-2 rounded-lg bg-purple-100 text-purple-800 font-bold whitespace-nowrap">+ Add database</button>
            </div>

            {settings.databaseConfig.databases.length === 0 ? (
              <div className="p-4 rounded-lg bg-gray-50 text-gray-600">The environment database is active. Add an instance here to enable database switching.</div>
            ) : (
              <div className="space-y-4">
                {settings.databaseConfig.databases.map((database, index) => (
                  <div className="rounded-xl border p-4 grid grid-cols-1 md:grid-cols-12 gap-3" key={`${database.id}-${index}`}>
                    <input className="md:col-span-3 px-3 py-2 border rounded-lg" aria-label="Database label" value={database.label} onChange={(event) => updateDatabase(index, 'label', event.target.value)} placeholder="Display name" />
                    <input className="md:col-span-6 px-3 py-2 border rounded-lg" aria-label="Database URL" value={database.databaseURL} onChange={(event) => updateDatabase(index, 'databaseURL', event.target.value)} placeholder="https://project-default-rtdb.firebaseio.com" />
                    <label className="md:col-span-2 flex items-center gap-2"><input type="checkbox" checked={database.enabled !== false} onChange={(event) => updateDatabase(index, 'enabled', event.target.checked)} /> Enabled</label>
                    <button type="button" className="md:col-span-1 text-red-600 font-bold" onClick={() => removeDatabase(index)}>Remove</button>
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-semibold mb-2">Active database</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg" value={settings.databaseConfig.activeDatabaseId} onChange={(event) => setSettings((current) => ({ ...current, databaseConfig: { ...current.databaseConfig, activeDatabaseId: event.target.value } }))}>
                    {settings.databaseConfig.databases.filter((database) => database.enabled !== false).map((database) => <option key={database.id} value={database.id}>{database.label}</option>)}
                  </select>
                  <p className="text-xs text-amber-700 mt-2">The Firebase service account must have access to every configured instance. Players use the selected database after their next page reload.</p>
                </div>
              </div>
            )}
          </div>

          <div className="border-b pb-6">
            <h2 className="text-xl font-bold mb-4">💵 Manual deposit settings</h2>
            <label className="block text-sm font-semibold mb-2">Coins credited per ₹1</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={settings.depositCoinRate}
              onChange={(event) => setSettings({ ...settings, depositCoinRate: Number(event.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-sm text-gray-600 mt-2">Edit <code>public/deposit-payment.html</code> to replace the placeholder shown after a player enters a deposit amount.</p>
          </div>

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
