import React, { useState } from 'react';
import { auth, db } from '@/firebase';
import { ref, update } from 'firebase/database';

export default function Profile() {
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await update(ref(db, `users/${user.uid}`), {
          displayName,
          photoURL
        });
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Error updating profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg p-8 shadow-lg">
      <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Photo URL</label>
          <input
            type="url"
            value={photoURL}
            onChange={(e) => setPhotoURL(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
          />
        </div>

        {message && <p className="text-green-600 font-semibold">{message}</p>}

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
