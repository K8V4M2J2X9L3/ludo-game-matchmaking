import express from 'express';
import { db, auth } from '../firebase-config.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName
    });

    // Create referral code
    const referralCode = `REF${userRecord.uid.substring(0, 8).toUpperCase()}`;

    // Store user data in database
    await db.ref(`users/${userRecord.uid}`).set({
      uid: userRecord.uid,
      email,
      displayName,
      photoURL: '',
      coins: 0,
      winningCoins: 0,
      totalWinnings: 0,
      createdAt: Date.now(),
      referralCode,
      referredBy: req.body.referralCode || null,
      referralRewards: 0,
      kycVerified: false,
      stats: {
        totalMatches: 0,
        totalWins: 0,
        winRate: 0
      }
    });

    // If user has a referral code, add them to referrer's referral list
    if (req.body.referralCode) {
      const referrerRef = db.ref('users').orderByChild('referralCode').equalTo(req.body.referralCode);
      const snapshot = await referrerRef.get();
      if (snapshot.exists()) {
        const referrerId = Object.keys(snapshot.val())[0];
        await db.ref(`referrals/${uuidv4()}`).set({
          referrerId,
          refereeId: userRecord.uid,
          rewardAmount: 10, // Default referral reward
          status: 'pending',
          createdAt: Date.now()
        });
      }
    }

    const token = await auth.createCustomToken(userRecord.uid);
    res.json({ success: true, token, uid: userRecord.uid, user: userRecord });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Firebase client SDK handles login, this is for reference
    res.json({ message: 'Use Firebase client SDK for login' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user profile
router.get('/profile/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const snapshot = await db.ref(`users/${uid}`).get();
    
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(snapshot.val());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update profile
router.put('/profile/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { displayName, photoURL } = req.body;

    await db.ref(`users/${uid}`).update({
      displayName,
      photoURL
    });

    const snapshot = await db.ref(`users/${uid}`).get();
    res.json(snapshot.val());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
