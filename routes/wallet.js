import express from 'express';
import { db as configDb, getActiveDb } from '../server.js';
import { verifyToken } from '../middleware/auth.js';
import Razorpay from 'razorpay';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay is not configured. Use the manual deposit request instead.');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

// Get wallet balance
router.get('/balance/:uid', verifyToken, async (req, res) => {
  try {
    const { uid } = req.params;
    if (uid !== req.user.uid) return res.status(403).json({ error: 'Access denied' });
    const db = await getActiveDb();
    const snapshot = await db.ref(`users/${uid}`).get();
    const user = snapshot.val();

    res.json({
      coins: user.coins || 0,
      winningCoins: user.winningCoins || 0,
      totalWinnings: user.totalWinnings || 0,
      referralRewards: user.referralRewards || 0
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add coins via Razorpay
router.post('/add-coins', verifyToken, async (req, res) => {
  try {
    const db = await getActiveDb();
    const { amount, coins } = req.body;
    const uid = req.user.uid;

    const order = await getRazorpay().orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    });

    const transactionId = uuidv4();
    await db.ref(`transactions/${uid}/${transactionId}`).set({
      uid,
      type: 'deposit',
      amount: coins,
      status: 'pending',
      description: `Add ${coins} coins`,
      timestamp: Date.now(),
      razorpayOrderId: order.id
    });

    res.json({ success: true, order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Verify payment and add coins
router.post('/verify-payment', verifyToken, async (req, res) => {
  try {
    const db = await getActiveDb();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const uid = req.user.uid;

    // Verify signature
    const crypto = await import('crypto');
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Find transaction
    const transactionsRef = db.ref(`transactions/${uid}`);
    const snapshot = await transactionsRef.get();
    let transaction = null;
    let transactionId = null;

    if (snapshot.exists()) {
      const transactions = snapshot.val();
      for (const [id, trans] of Object.entries(transactions)) {
        if (trans.razorpayOrderId === razorpayOrderId) {
          transaction = trans;
          transactionId = id;
          break;
        }
      }
    }

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update transaction status
    await db.ref(`transactions/${uid}/${transactionId}`).update({
      status: 'completed',
      razorpayPaymentId
    });

    // Add coins to user
    const userRef = db.ref(`users/${uid}`);
    const userSnapshot = await userRef.get();
    const user = userSnapshot.val();

    await userRef.update({
      coins: (user.coins || 0) + transaction.amount
    });

    res.json({ success: true, message: 'Coins added successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get transaction history
router.get('/transactions/:uid', verifyToken, async (req, res) => {
  try {
    const { uid } = req.params;
    if (uid !== req.user.uid) return res.status(403).json({ error: 'Access denied' });
    const db = await getActiveDb();
    const snapshot = await db.ref(`transactions/${uid}`).get();

    if (!snapshot.exists()) {
      return res.json([]);
    }

    const transactions = Object.values(snapshot.val());
    res.json(transactions.sort((a, b) => b.timestamp - a.timestamp));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create a manual deposit request after the player completes the custom HTML payment step.
router.post('/deposit-request', verifyToken, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const paymentReference = String(req.body.paymentReference || '').trim().toUpperCase();
    if (!Number.isSafeInteger(amount) || amount < 10) {
      return res.status(400).json({ error: 'Deposit amount must be at least ₹10' });
    }
    if (paymentReference.length < 4 || paymentReference.length > 80) {
      return res.status(400).json({ error: 'Enter a valid payment reference number' });
    }

    const db = await getActiveDb();
    const uid = req.user.uid;
    const [userSnapshot, settingsSnapshot] = await Promise.all([
      db.ref(`users/${uid}`).get(),
      configDb.ref('admin/settings').get()
    ]);
    const user = userSnapshot.val();
    if (!user) return res.status(404).json({ error: 'User account was not found' });

    const configuredRate = Number(settingsSnapshot.val()?.depositCoinRate);
    const rate = Number.isFinite(configuredRate) && configuredRate > 0 ? configuredRate : 1;
    const coins = Math.floor(amount * rate);
    const requestId = db.ref('depositRequests').push().key;
    const transactionId = uuidv4();
    const createdAt = Date.now();
    const request = {
      requestId,
      transactionId,
      uid,
      userName: user.displayName || user.username || 'Player',
      userPhone: user.phone || user.email || '',
      amount,
      coins,
      paymentReference,
      status: 'pending',
      createdAt
    };

    let failure = '';
    const result = await db.ref().transaction((root) => {
      if (!root?.users?.[uid]) {
        failure = 'User account was not found';
        return;
      }
      const duplicate = Object.values(root.depositRequests || {}).some(
        (existing) => existing?.paymentReference === paymentReference
      );
      if (duplicate) {
        failure = 'This payment reference has already been submitted';
        return;
      }
      root.depositRequests = root.depositRequests || {};
      root.transactions = root.transactions || {};
      root.transactions[uid] = root.transactions[uid] || {};
      root.depositRequests[requestId] = request;
      root.transactions[uid][transactionId] = {
        uid,
        type: 'deposit',
        amount: coins,
        cashAmount: amount,
        status: 'pending',
        description: `Deposit request ${paymentReference}`,
        timestamp: createdAt,
        depositRequestId: requestId
      };
      return root;
    });
    if (!result.committed) return res.status(409).json({ error: failure || 'Could not submit deposit' });

    res.json({ success: true, request });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
