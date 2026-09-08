import admin from 'firebase-admin';
import { db } from '../server.js';
import jwt from 'jsonwebtoken';

export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const adminPayload = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || 'change-this-admin-secret'
    );
    if (adminPayload.role !== 'admin') throw new Error('Invalid admin role');
    req.admin = adminPayload;
    return next();
  } catch (adminTokenError) {
    // Also accept Firebase ID tokens for database-backed admin accounts.
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const adminRef = db.ref(`admins/${decodedToken.uid}`);
    const snapshot = await adminRef.get();

    if (!snapshot.exists()) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = decodedToken;
    req.admin = snapshot.val();
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired admin token' });
  }
};
