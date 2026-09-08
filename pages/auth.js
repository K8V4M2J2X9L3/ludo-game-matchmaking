import React, { useState } from 'react';
import Link from 'next/link';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/firebase';
import { apiRequest } from '@/lib/api';

const normalizePhone = (value) => value.replace(/\D/g, '').slice(-10);
const phoneEmail = (phone) => `${phone}@friendludo.com`;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (event) => {
    event.preventDefault();
    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const email = phoneEmail(normalizedPhone);
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName });
        const token = await credential.user.getIdToken();
        await apiRequest('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            uid: credential.user.uid,
            email,
            phone: normalizedPhone,
            displayName,
            referralCode: referralCode.trim() || null
          })
        });
      }
      window.location.href = '/dashboard';
    } catch (authError) {
      setError(authError.message.replace('Firebase: ', '').replace(/\(auth\/.+\)\.?/, '').trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <header className="auth-header">
        <Link href="/" className="brand">
          <span className="brand-die">⚄</span>
          <span><strong>Friend</strong>Ludo<small>PLAY • WIN • REPEAT</small></span>
        </Link>
        <Link href="/support" className="guide-button">ⓘ Help</Link>
      </header>

      <main className="auth-content">
        <section className="signup-bonus">🎁 <strong>Register now & get ₹20 free signup bonus</strong></section>
        <section className="auth-card">
          <div className="auth-card-heading">
            <span className="eyebrow">{isLogin ? 'WELCOME BACK' : 'JOIN FRIENDLUDO'}</span>
            <h1>{isLogin ? 'Log in to play' : 'Create your account'}</h1>
            <p>{isLogin ? 'Your next real-player battle is waiting.' : 'Start with free chips and challenge real players.'}</p>
          </div>

          <form onSubmit={handleAuth}>
            {!isLogin && (
              <label>
                <span>Player name</span>
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="What should players call you?" minLength="2" maxLength="24" required />
              </label>
            )}
            <label>
              <span>Mobile number</span>
              <div className="phone-input"><strong>+91</strong><input type="tel" inputMode="numeric" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="10-digit mobile number" required /></div>
            </label>
            <label>
              <span>Password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="6" placeholder="Minimum 6 characters" required />
            </label>
            {!isLogin && (
              <label>
                <span>Referral code <small>(optional)</small></span>
                <input value={referralCode} onChange={(event) => setReferralCode(event.target.value)} placeholder="Friend's referral code" />
              </label>
            )}
            {error && <p className="form-error">{error}</p>}
            <p className="legal-copy">By continuing, you confirm that you are 18 or older and agree to our <Link href="/policies">legal terms</Link>.</p>
            <button type="submit" className="primary-action" disabled={loading}>{loading ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}</button>
          </form>
          <button type="button" className="auth-switch" onClick={() => { setIsLogin((value) => !value); setError(''); }}>
            {isLogin ? 'New to FriendLudo? Create account' : 'Already have an account? Log in'}
          </button>
        </section>
      </main>
    </div>
  );
}
