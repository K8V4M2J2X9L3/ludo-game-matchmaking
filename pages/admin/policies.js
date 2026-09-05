import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavbar from '@/components/AdminNavbar';

export default function AdminPolicies() {
  const [policies, setPolicies] = useState({
    privacyPolicy: '',
    termsAndConditions: '',
    refundPolicy: '',
    gstPolicy: '',
    supportTelegram: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
    } else {
      fetchPolicies();
    }
  }, []);

  const fetchPolicies = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/policies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setPolicies(data);
    } catch (error) {
      console.error('Error fetching policies:', error);
    }
  };

  const handleSavePolicies = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/policies', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(policies)
      });
      const data = await response.json();
      setMessage('Policies updated successfully!');
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
        <h1 className="text-3xl font-bold mb-8">📋 Policies & Legal</h1>

        <div className="bg-white rounded-lg p-8 shadow-lg space-y-6">
          {/* Support Telegram Link */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-bold mb-4">💬 Support Link</h2>
            <div>
              <label className="block text-sm font-semibold mb-2">Telegram Support URL</label>
              <input
                type="url"
                value={policies.supportTelegram}
                onChange={(e) => setPolicies({ ...policies, supportTelegram: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="https://t.me/your_support_channel"
              />
              <p className="text-sm text-gray-600 mt-2">Users will be redirected to this Telegram link for support</p>
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-bold mb-4">🔒 Privacy Policy</h2>
            <textarea
              value={policies.privacyPolicy}
              onChange={(e) => setPolicies({ ...policies, privacyPolicy: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              rows="8"
              placeholder="Enter your privacy policy here..."
            />
          </div>

          {/* Terms and Conditions */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-bold mb-4">⚖️ Terms & Conditions</h2>
            <textarea
              value={policies.termsAndConditions}
              onChange={(e) => setPolicies({ ...policies, termsAndConditions: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              rows="8"
              placeholder="Enter your terms and conditions here..."
            />
          </div>

          {/* Refund Policy */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-bold mb-4">💰 Refund Policy</h2>
            <textarea
              value={policies.refundPolicy}
              onChange={(e) => setPolicies({ ...policies, refundPolicy: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              rows="8"
              placeholder="Enter your refund policy here..."
            />
          </div>

          {/* GST Policy */}
          <div className="pb-6">
            <h2 className="text-xl font-bold mb-4">🧾 GST Policy</h2>
            <textarea
              value={policies.gstPolicy}
              onChange={(e) => setPolicies({ ...policies, gstPolicy: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              rows="8"
              placeholder="Enter your GST policy here..."
            />
          </div>

          {message && <p className="text-green-600 font-semibold">{message}</p>}

          <button
            onClick={handleSavePolicies}
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Policies'}
          </button>
        </div>
      </main>
    </div>
  );
}
