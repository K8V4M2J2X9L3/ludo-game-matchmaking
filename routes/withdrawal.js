import express from 'express';
import { db } from '../server.js';
import { verifyToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Request withdrawal
router.post('/request', verifyToken, async (req, res) => {
  try {
    const { amount, accountNumber, ifscCode, accountHolder } = req.body;
    const uid = req.user.uid;

    // Verify user balance
    const userRef = db.ref(`users/${uid}`);
    const userSnapshot = await userRef.get();
    const user = userSnapshot.val();

    const adminSettingsRef = db.ref('admin/settings');
    const settingsSnapshot = await adminSettingsRef.get();
    const settings = settingsSnapshot.val() || { minimumWithdrawal: 100 };

    if (user.winningCoins < amount) {
      return res.status(400).json({ error: 'Insufficient winning coins' });
    }

    if (amount < settings.minimumWithdrawal) {
      return res.status(400).json({ error: `Minimum withdrawal is ₹${settings.minimumWithdrawal}` });
    }

    // Create withdrawal request
    const requestId = uuidv4();
    await db.ref(`withdrawalRequests/${requestId}`).set({
      uid,
      amount,
      bankDetails: {
        accountNumber,
        ifscCode,
        accountHolder
      },
      status: 'pending',
      requestedAt: Date.now(),
      processedAt: null,
      adminNotes: null
    });

    res.json({ success: true, requestId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get withdrawal requests for user
router.get('/requests/:uid', verifyToken, async (req, res) => {
  try {
    const { uid } = req.params;
    const snapshot = await db.ref('withdrawalRequests').orderByChild('uid').equalTo(uid).get();

    if (!snapshot.exists()) {
      return res.json([]);
    }

    const requests = Object.entries(snapshot.val()).map(([id, data]) => ({
      id,
      ...data
    }));

    res.json(requests.sort((a, b) => b.requestedAt - a.requestedAt));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
