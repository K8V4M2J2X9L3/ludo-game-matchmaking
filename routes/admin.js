import express from 'express';
import { db, getActiveDb } from '../server.js';
import { verifyAdmin } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }

    const token = jwt.sign(
      { role: 'admin' },
      process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || 'change-this-admin-secret',
      { expiresIn: '12h' }
    );
    res.json({ success: true, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Public bootstrap used by the web app before it attaches Firebase listeners.
router.get('/database-config', async (req, res) => {
  try {
    const snapshot = await db.ref('admin/settings/databaseConfig').get();
    const config = snapshot.val();
    const databases = Array.isArray(config?.databases)
      ? config.databases
      : Object.values(config?.databases || {});
    const active = databases.find(
      (database) => database.id === config.activeDatabaseId && database.enabled !== false
    );
    res.json({
      databaseId: active?.id || 'primary',
      databaseURL: active?.databaseURL || process.env.FIREBASE_DATABASE_URL || null
    });
  } catch (error) {
    res.json({ databaseId: 'primary', databaseURL: process.env.FIREBASE_DATABASE_URL || null });
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
    if (settings.depositCoinRate !== undefined) {
      const rate = Number(settings.depositCoinRate);
      if (!Number.isFinite(rate) || rate <= 0 || rate > 1000) {
        return res.status(400).json({ error: 'Deposit coin rate must be between 0 and 1000' });
      }
      settings.depositCoinRate = rate;
    }
    if (settings.databaseConfig) {
      const rawDatabases = Array.isArray(settings.databaseConfig.databases)
        ? settings.databaseConfig.databases
        : [];
      const databases = rawDatabases.map((database) => ({
        id: String(database.id || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        label: String(database.label || database.id || '').trim().slice(0, 50),
        databaseURL: String(database.databaseURL || '').trim(),
        enabled: database.enabled !== false
      }));
      const ids = new Set();
      for (const database of databases) {
        if (!database.id || ids.has(database.id)) {
          return res.status(400).json({ error: 'Each database needs a unique ID' });
        }
        if (!/^https:\/\/[a-z0-9.-]+\.(?:firebaseio\.com|firebasedatabase\.app)$/i.test(database.databaseURL || '')) {
          return res.status(400).json({ error: `Invalid database URL for ${database.label || database.id}` });
        }
        ids.add(database.id);
      }
      const activeDatabaseId = String(settings.databaseConfig.activeDatabaseId || '')
        .trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
      if (databases.length && !ids.has(activeDatabaseId)) {
        return res.status(400).json({ error: 'Choose an active database from the configured list' });
      }
      settings.databaseConfig.databases = databases;
      settings.databaseConfig.activeDatabaseId = activeDatabaseId;
    }
    await db.ref('admin/settings').update(settings);
    res.json({ success: true, settings });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all users
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const activeDb = await getActiveDb();
    const snapshot = await activeDb.ref('users').get();
    const users = snapshot.exists() ? Object.values(snapshot.val()) : [];
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all withdrawal requests
router.get('/withdrawal-requests', verifyAdmin, async (req, res) => {
  try {
    const activeDb = await getActiveDb();
    const snapshot = await activeDb.ref('withdrawalRequests').get();
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
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const activeDb = await getActiveDb();
    let failure = '';
    const result = await activeDb.ref().transaction((root) => {
      const request = root?.withdrawalRequests?.[requestId];
      if (!request) {
        failure = 'Withdrawal request was not found';
        return;
      }
      if (request.status !== 'pending') {
        failure = 'Withdrawal request was already processed';
        return;
      }
      const user = root.users?.[request.uid];
      if (status === 'approved' && (!user || (user.winningCoins || 0) < request.amount)) {
        failure = 'User no longer has enough winning coins';
        return;
      }

      request.status = status;
      request.adminNotes = String(adminNotes || '').slice(0, 300);
      request.processedAt = Date.now();
      if (status === 'approved') user.winningCoins -= request.amount;
      return root;
    });

    if (!result.committed) return res.status(409).json({ error: failure || 'Could not process withdrawal' });
    res.json({ success: true, request: result.snapshot.child(`withdrawalRequests/${requestId}`).val() });
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
    const { uid, reason } = req.body;
    const coins = Number(req.body.coins);
    if (!uid || !Number.isSafeInteger(coins) || coins <= 0) {
      return res.status(400).json({ error: 'Choose a user and enter a positive whole number of coins' });
    }
    const { v4: uuidv4 } = await import('uuid');

    const activeDb = await getActiveDb();
    const userRef = activeDb.ref(`users/${uid}`);
    const userSnapshot = await userRef.get();
    const user = userSnapshot.val();
    if (!user) return res.status(404).json({ error: 'User was not found' });

    await userRef.update({
      coins: (user.coins || 0) + coins
    });

    const transactionId = uuidv4();
    await activeDb.ref(`transactions/${uid}/${transactionId}`).set({
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
    const activeDb = await getActiveDb();
    const usersRef = activeDb.ref('users');
    const matchesRef = activeDb.ref('matchmaking');
    const withdrawalsRef = activeDb.ref('withdrawalRequests');

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

router.get('/deposit-requests', verifyAdmin, async (req, res) => {
  try {
    const activeDb = await getActiveDb();
    const snapshot = await activeDb.ref('depositRequests').get();
    const requests = snapshot.exists()
      ? Object.entries(snapshot.val()).map(([id, request]) => ({ id, ...request }))
      : [];
    res.json(requests.sort((a, b) => b.createdAt - a.createdAt));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/deposit-requests/:requestId', verifyAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, adminNotes = '' } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const activeDb = await getActiveDb();
    let failure = '';
    const result = await activeDb.ref().transaction((root) => {
      const request = root?.depositRequests?.[requestId];
      if (!request) {
        failure = 'Deposit request was not found';
        return;
      }
      if (request.status !== 'pending') {
        failure = 'Deposit request was already processed';
        return;
      }

      request.status = status;
      request.adminNotes = String(adminNotes).slice(0, 300);
      request.processedAt = Date.now();
      const transaction = root.transactions?.[request.uid]?.[request.transactionId];
      if (transaction) {
        transaction.status = status === 'approved' ? 'completed' : 'failed';
      }
      if (status === 'approved') {
        const user = root.users?.[request.uid];
        if (!user) {
          failure = 'Deposit user was not found';
          return;
        }
        user.coins = (user.coins || 0) + request.coins;
      }
      return root;
    });

    if (!result.committed) return res.status(409).json({ error: failure || 'Could not process deposit' });
    res.json({ success: true, request: result.snapshot.child(`depositRequests/${requestId}`).val() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
