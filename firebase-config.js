import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

export const db = admin.database();
export const auth = admin.auth();
export default admin;
