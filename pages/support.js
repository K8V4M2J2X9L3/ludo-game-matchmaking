import React, { useState } from 'react';

const TELEGRAM_SUPPORT_LINK = 'https://t.me/ludogame_support';

export default function Support() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg p-8 shadow-lg">
      <h1 className="text-3xl font-bold mb-6">Support & Help</h1>

      <div className="space-y-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">📞 Need Help?</h2>
          <p className="text-gray-700 mb-4">Connect with our support team on Telegram for instant assistance.</p>
          <a
            href={TELEGRAM_SUPPORT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold"
          >
            💬 Open Telegram Support
          </a>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">FAQ</h2>
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-gray-800">How do I add coins?</p>
              <p className="text-gray-600">Go to Wallet &gt; Add Coins and follow the payment process.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">How long does withdrawal take?</p>
              <p className="text-gray-600">Withdrawals are processed within 24-48 hours after admin approval.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Can I get a refund?</p>
              <p className="text-gray-600">Check our Refund Policy for details on refund eligibility.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
