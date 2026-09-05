import express from 'express';
import { db } from '../server.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get all transactions for user
router.get('/history/:uid', verifyToken, async (req, res) => {
  try {
    const { uid } = req.params;
    const snapshot = await db.ref(`transactions/${uid}`).get();

    if (!snapshot.exists()) {
      return res.json([]);
    }

    const transactions = Object.entries(snapshot.val()).map(([id, data]) => ({
      id,
      ...data
    }));

    res.json(transactions.sort((a, b) => b.timestamp - a.timestamp));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get transaction statistics
router.get('/stats/:uid', verifyToken, async (req, res) => {
  try {
    const { uid } = req.params;
    const snapshot = await db.ref(`transactions/${uid}`).get();

    if (!snapshot.exists()) {
      return res.json({
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalWinnings: 0,
        totalLosses: 0
      });
    }

    const transactions = Object.values(snapshot.val());
    const stats = {
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalWinnings: 0,
      totalLosses: 0
    };

    transactions.forEach(trans => {
      if (trans.status === 'completed') {
        if (trans.type === 'deposit') stats.totalDeposits += trans.amount;
        if (trans.type === 'withdrawal') stats.totalWithdrawals += trans.amount;
        if (trans.type === 'win') stats.totalWinnings += trans.amount;
        if (trans.type === 'loss') stats.totalLosses += trans.amount;
      }
    });

    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
