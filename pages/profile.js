import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { onValue, ref, update } from 'firebase/database';
import { auth, db } from '@/firebase';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';

export default function Profile() {
  const [account, setAccount] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let unsubscribeAccount = () => {};
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeAccount();
      if (!user) {
        window.location.href = '/auth';
        return;
      }
      unsubscribeAccount = onValue(ref(db, `users/${user.uid}`), (snapshot) => {
        const data = snapshot.val() || {};
        setAccount({ ...user, ...data });
        setDisplayName(data.displayName || user.displayName || '');
        setPhotoURL(data.photoURL || '');
      });
    });
    return () => { unsubscribeAuth(); unsubscribeAccount(); };
  }, []);

  const handleSaveProfile = async () => {
    if (!auth.currentUser || displayName.trim().length < 2) return;
    setSaving(true);
    setMessage('');
    try {
      await update(ref(db, `users/${auth.currentUser.uid}`), {
        displayName: displayName.trim(),
        photoURL: photoURL.trim()
      });
      setMessage('Profile updated successfully.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="user-page">
      <Navbar user={account} />
      <main className="mobile-content">
        <section className="profile-hero">
          <div className="profile-avatar">{(account?.displayName || 'P').slice(0, 1).toUpperCase()}</div>
          <div><span className="eyebrow">PLAYER PROFILE</span><h1>{account?.displayName || 'Player'}</h1><p>+91 {account?.phone || '—'}</p></div>
        </section>
        <section className="profile-stats">
          <div><strong>{account?.stats?.totalMatches || 0}</strong><span>Games played</span></div>
          <div><strong>₹{account?.totalWinnings || 0}</strong><span>Chips won</span></div>
          <div><strong>₹{account?.referralRewards || 0}</strong><span>Referral earning</span></div>
        </section>
        <section className="surface-card profile-form">
          <h2>Edit profile</h2>
          <label className="field-label" htmlFor="display-name">Player name</label>
          <input id="display-name" className="standard-input" value={displayName} minLength="2" maxLength="24" onChange={(event) => setDisplayName(event.target.value)} />
          <label className="field-label" htmlFor="photo-url">Photo URL <small>(optional)</small></label>
          <input id="photo-url" className="standard-input" type="url" value={photoURL} onChange={(event) => setPhotoURL(event.target.value)} placeholder="https://…" />
          <button className="primary-action profile-save" onClick={handleSaveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
          {message && <p className="inline-message">{message}</p>}
        </section>
        <nav className="profile-links">
          <Link href="/referral"><span>🎁</span>Refer & earn<strong>›</strong></Link>
          <Link href="/support"><span>🎧</span>Support<strong>›</strong></Link>
          <Link href="/policies"><span>📄</span>Policies & terms<strong>›</strong></Link>
        </nav>
      </main>
      <BottomNav active="profile" />
    </div>
  );
}
