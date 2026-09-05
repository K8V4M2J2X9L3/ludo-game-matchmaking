import express from 'express';
import { db } from '../server.js';
import { verifyAdmin } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }

    res.json({ success: true, token: crypto.randomBytes(32).toString('hex') });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get admin settings
router.get('/settings', verifyAdmin, async (req, res) => {
  try {
    const snapshot = await db.ref('admin/settings').get();
    const settings = snapshot.exists() ? snapshot.val() : {};
    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update admin settings
router.put('/settings', verifyAdmin, async (req, res) => {
  try {
    const settings = req.body;
    await db.ref('admin/settings').update(settings);
    res.json({ success: true, settings });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all users
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const snapshot = await db.ref('users').get();
    const users = snapshot.exists() ? Object.values(snapshot.val()) : [];
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all withdrawal requests
router.get('/withdrawal-requests', verifyAdmin, async (req, res) => {
  try {
    const snapshot = await db.ref('withdrawalRequests').get();
    const requests = snapshot.exists() ? Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data })) : [];
    res.json(requests);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Approve/Reject withdrawal
router.put('/withdrawal-requests/:requestId', verifyAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, adminNotes } = req.body;

    const requestRef = db.ref(`withdrawalRequests/${requestId}`);
    await requestRef.update({
      status,
      adminNotes,
      processedAt: Date.now()
    });

    const snapshot = await requestRef.get();
    const request = snapshot.val();

    // If approved, deduct from user's winning coins
    if (status === 'approved') {
      const userRef = db.ref(`users/${request.uid}`);
      const userSnapshot = await userRef.get();
      const user = userSnapshot.val();

      await userRef.update({
        winningCoins: (user.winningCoins || 0) - request.amount
      });
    }

    res.json({ success: true, request });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get policies
router.get('/policies', verifyAdmin, async (req, res) => {
  try {
    const snapshot = await db.ref('admin/policies').get();
    const policies = snapshot.exists() ? snapshot.val() : {};
    res.json(policies);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update policies
router.put('/policies', verifyAdmin, async (req, res) => {
  try {
    const policies = req.body;
    await db.ref('admin/policies').update(policies);
    res.json({ success: true, policies });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add coins manually (Zappi API)
router.post('/add-coins', verifyAdmin, async (req, res) => {
  try {
    const { uid, coins, reason } = req.body;
    const { v4: uuidv4 } = await import('uuid');

    const userRef = db.ref(`users/${uid}`);
    const userSnapshot = await userRef.get();
    const user = userSnapshot.val();

    await userRef.update({
      coins: (user.coins || 0) + coins
    });

    const transactionId = uuidv4();
    await db.ref(`transactions/${uid}/${transactionId}`).set({
      uid,
      type: 'deposit',
      amount: coins,
      status: 'completed',
      description: reason || 'Admin added coins',
      timestamp: Date.now()
    });

    res.json({ success: true, message: `Added ${coins} coins to user ${uid}` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get dashboard stats
router.get('/dashboard', verifyAdmin, async (req, res) => {
  try {
    const usersRef = db.ref('users');
    const matchesRef = db.ref('matchmaking');
    const withdrawalsRef = db.ref('withdrawalRequests');

    const [usersSnapshot, matchesSnapshot, withdrawalsSnapshot] = await Promise.all([
      usersRef.get(),
      matchesRef.get(),
      withdrawalsRef.get()
    ]);

    const users = usersSnapshot.exists() ? Object.values(usersSnapshot.val()) : [];
    const matches = matchesSnapshot.exists() ? Object.values(matchesSnapshot.val()) : [];
    const withdrawals = withdrawalsSnapshot.exists() ? Object.values(withdrawalsSnapshot.val()) : [];

    const stats = {
      totalUsers: users.length,
      totalMatches: matches.length,
      completedMatches: matches.filter(m => m.status === 'completed').length,
      pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length,
      totalWinningsDistributed: matches.reduce((sum, m) => sum + (m.winAmount || 0), 0),
      activeMatches: matches.filter(m => m.status === 'ongoing').length
    };

    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
