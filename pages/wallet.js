import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { onValue, ref } from 'firebase/database';
import { auth, db } from '@/firebase';
import { apiRequest } from '@/lib/api';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';

export default function Wallet() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState({ coins: 0, winningCoins: 0, totalWinnings: 0 });
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => onAuthStateChanged(auth, (currentUser) => {
    if (!currentUser) {
      window.location.href = '/auth';
      return;
    }
    setUser(currentUser);
  }), []);

  useEffect(() => {
    if (!user) return undefined;
    const unsubscribeWallet = onValue(ref(db, `users/${user.uid}`), (snapshot) => {
      const data = snapshot.val() || {};
      setBalance({
        coins: data.coins || 0,
        winningCoins: data.winningCoins || 0,
        totalWinnings: data.totalWinnings || 0
      });
    });
    const unsubscribeTransactions = onValue(ref(db, `transactions/${user.uid}`), (snapshot) => {
      const items = snapshot.exists()
        ? Object.entries(snapshot.val()).map(([id, transaction]) => ({ id, ...transaction }))
        : [];
      setTransactions(items.sort((a, b) => b.timestamp - a.timestamp));
    });
    return () => {
      unsubscribeWallet();
      unsubscribeTransactions();
    };
  }, [user]);

  const numericAmount = Number(amount);
  const paymentPageUrl = useMemo(
    () => `/deposit-payment.html?amount=${encodeURIComponent(amount || '0')}`,
    [amount]
  );

  const continueToPayment = () => {
    if (!Number.isSafeInteger(numericAmount) || numericAmount < 10) {
      setMessage('Enter a deposit amount of at least ₹10.');
      return;
    }
    setMessage('');
    setShowPaymentPage(true);
  };

  const submitDeposit = async () => {
    setLoading(true);
    setMessage('');
    try {
      const token = await auth.currentUser.getIdToken();
      await apiRequest('/api/wallet/deposit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: numericAmount, paymentReference })
      });
      setMessage('Deposit submitted. Coins will be added after admin approval.');
      setAmount('');
      setPaymentReference('');
      setShowPaymentPage(false);
      setActiveTab('history');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-page">
      <Navbar user={{ ...user, coins: balance.coins }} />
      <main className="mobile-content wallet-page">
        <div className="page-title-row">
          <div>
            <span className="eyebrow">YOUR MONEY</span>
            <h1>Wallet</h1>
          </div>
          <button className="outline-button" type="button" onClick={() => setActiveTab('history')}>History</button>
        </div>

        <div className="wallet-summary-grid">
          <section className="wallet-summary deposit-balance">
            <span>Deposit chips</span>
            <strong>₹{balance.coins}</strong>
            <small>Ready to play</small>
          </section>
          <section className="wallet-summary winning-balance">
            <span>Winning chips</span>
            <strong>₹{balance.winningCoins}</strong>
            <small>Available to withdraw</small>
          </section>
        </div>

        <div className="segmented-tabs">
          <button className={activeTab === 'deposit' ? 'active' : ''} onClick={() => setActiveTab('deposit')}>Add cash</button>
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>Transactions</button>
        </div>

        {activeTab === 'deposit' ? (
          <section className="surface-card deposit-card">
            <div className="card-title-block">
              <span className="card-icon">＋</span>
              <div>
                <h2>Add deposit chips</h2>
                <p>Enter an amount, complete the payment, then send its reference for approval.</p>
              </div>
            </div>

            {!showPaymentPage ? (
              <>
                <label className="field-label" htmlFor="deposit-amount">Deposit amount</label>
                <div className="money-field">
                  <span>₹</span>
                  <input
                    id="deposit-amount"
                    type="number"
                    min="10"
                    inputMode="numeric"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
                <div className="quick-amounts deposit-quick-amounts">
                  {[100, 250, 500, 1000].map((value) => (
                    <button key={value} type="button" onClick={() => setAmount(String(value))}>₹{value}</button>
                  ))}
                </div>
                <button className="primary-action" type="button" onClick={continueToPayment}>Continue to payment</button>
              </>
            ) : (
              <div className="payment-step">
                <div className="payment-frame-header">
                  <div><span>PAYMENT AMOUNT</span><strong>₹{numericAmount}</strong></div>
                  <button type="button" onClick={() => setShowPaymentPage(false)}>Change</button>
                </div>
                <iframe
                  className="deposit-payment-frame"
                  src={paymentPageUrl}
                  title="Deposit payment instructions"
                  sandbox="allow-scripts allow-forms allow-popups allow-top-navigation-by-user-activation"
                />
                <label className="field-label" htmlFor="payment-reference">Payment / UTR reference</label>
                <input
                  className="standard-input"
                  id="payment-reference"
                  value={paymentReference}
                  maxLength="80"
                  onChange={(event) => setPaymentReference(event.target.value)}
                  placeholder="Enter reference after payment"
                />
                <button className="primary-action" type="button" disabled={loading} onClick={submitDeposit}>
                  {loading ? 'Submitting…' : 'Send for admin approval'}
                </button>
              </div>
            )}
            {message && <p className="inline-message">{message}</p>}
          </section>
        ) : (
          <section className="surface-card transaction-card">
            <h2>Recent transactions</h2>
            {transactions.length === 0 ? (
              <div className="empty-transactions"><span>🧾</span><p>No transactions yet.</p></div>
            ) : transactions.map((transaction) => (
              <div className="transaction-row" key={transaction.id}>
                <div className={`transaction-icon ${transaction.type}`}>{transaction.type === 'deposit' ? '↓' : '₹'}</div>
                <div className="transaction-copy">
                  <strong>{transaction.description || transaction.type}</strong>
                  <span>{new Date(transaction.timestamp).toLocaleString()}</span>
                </div>
                <div className="transaction-value">
                  <strong>₹{transaction.amount}</strong>
                  <span className={`status ${transaction.status}`}>{transaction.status}</span>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
      <BottomNav active="wallet" />
    </div>
  );
}
