import React, { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { ref, onValue } from 'firebase/database';

export default function Policies() {
  const [policies, setPolicies] = useState({
    privacyPolicy: '',
    termsAndConditions: '',
    refundPolicy: '',
    gstPolicy: ''
  });

  useEffect(() => {
    const policiesRef = ref(db, 'admin/policies');
    onValue(policiesRef, (snapshot) => {
      if (snapshot.exists()) {
        setPolicies(snapshot.val());
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold">Policies & Legal</h1>
          <p className="text-lg mt-2 opacity-90">Please read our policies carefully</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Table of Contents */}
        <div className="bg-white rounded-lg p-6 shadow mb-8">
          <h2 className="text-2xl font-bold mb-4">Contents</h2>
          <ul className="space-y-2 text-purple-600">
            <li>📋 <a href="#privacy">Privacy Policy</a></li>
            <li>⚖️ <a href="#terms">Terms & Conditions</a></li>
            <li>💰 <a href="#refund">Refund Policy</a></li>
            <li>🧾 <a href="#gst">GST Policy</a></li>
          </ul>
        </div>

        {/* Privacy Policy */}
        <div id="privacy" className="bg-white rounded-lg p-8 shadow mb-8">
          <h2 className="text-3xl font-bold mb-4">🔒 Privacy Policy</h2>
          <div className="prose max-w-none">
            {policies.privacyPolicy ? (
              <p className="whitespace-pre-wrap text-gray-700">{policies.privacyPolicy}</p>
            ) : (
              <p className="text-gray-500 italic">Privacy policy will be loaded from admin panel...</p>
            )}
          </div>
        </div>

        {/* Terms & Conditions */}
        <div id="terms" className="bg-white rounded-lg p-8 shadow mb-8">
          <h2 className="text-3xl font-bold mb-4">⚖️ Terms & Conditions</h2>
          <div className="prose max-w-none">
            {policies.termsAndConditions ? (
              <p className="whitespace-pre-wrap text-gray-700">{policies.termsAndConditions}</p>
            ) : (
              <p className="text-gray-500 italic">Terms and conditions will be loaded from admin panel...</p>
            )}
          </div>
        </div>

        {/* Refund Policy */}
        <div id="refund" className="bg-white rounded-lg p-8 shadow mb-8">
          <h2 className="text-3xl font-bold mb-4">💰 Refund Policy</h2>
          <div className="prose max-w-none">
            {policies.refundPolicy ? (
              <p className="whitespace-pre-wrap text-gray-700">{policies.refundPolicy}</p>
            ) : (
              <p className="text-gray-500 italic">Refund policy will be loaded from admin panel...</p>
            )}
          </div>
        </div>

        {/* GST Policy */}
        <div id="gst" className="bg-white rounded-lg p-8 shadow mb-8">
          <h2 className="text-3xl font-bold mb-4">🧾 GST Policy</h2>
          <div className="prose max-w-none">
            {policies.gstPolicy ? (
              <p className="whitespace-pre-wrap text-gray-700">{policies.gstPolicy}</p>
            ) : (
              <p className="text-gray-500 italic">GST policy will be loaded from admin panel...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
