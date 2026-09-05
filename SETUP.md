# Setup Guide - Complete Installation & Configuration

## Quick Start (5 Minutes)

### 1. Clone & Install
```bash
git clone https://github.com/K8V4M2J2X9L3/ludo-game-matchmaking.git
cd ludo-game-matchmaking
npm install
```

### 2. Configure Firebase
```bash
cp .env.example .env.local
```

Edit `.env.local` and add:
- Firebase credentials from your Firebase Console
- Razorpay keys
- Admin password (default: Bankai$1000)

### 3. Setup Firebase Database Rules

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Realtime Database → Rules
4. Copy content from `firebase-rules.json`
5. Click Publish

### 4. Create Admin User

1. Manually create a user via signup
2. Get the Firebase UID
3. Go to Firebase Console → Realtime Database
4. Create structure: `admins/{uid}` with:
```json
{
  "uid": "your_firebase_uid",
  "email": "your_email@example.com",
  "role": "super_admin",
  "createdAt": 1234567890000
}
```

### 5. Run Servers

**Backend (Terminal 1):**
```bash
npm run dev
# Runs on http://localhost:5000
```

**Frontend (Terminal 2):**
```bash
npm run client
# Runs on http://localhost:3000
```

### 6. Access Application

- User App: http://localhost:3000
- Admin Panel: http://localhost:3000/admin/login
- Admin Password: `Bankai$1000`

---

## Detailed Configuration

### Firebase Setup

#### Create Firebase Project
1. Visit [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Fill in project details
4. Enable Google Analytics (optional)
5. Create project

#### Enable Authentication
1. Go to Authentication → Sign-in method
2. Enable "Email/Password"
3. Enable "Google" (optional)
4. Save

#### Create Realtime Database
1. Go to Realtime Database
2. Click "Create Database"
3. Choose region
4. Start in test mode (change later)
5. Create database

#### Get Firebase Credentials
1. Go to Project Settings (gear icon)
2. Copy Web API Key
3. Copy Auth Domain
4. Copy Database URL
5. Copy Project ID
6. Copy Storage Bucket
7. Copy Messaging Sender ID
8. Copy App ID
9. Copy Measurement ID (if available)

#### Setup Service Account
1. Go to Project Settings
2. Go to "Service Accounts" tab
3. Click "Generate New Private Key"
4. Save the JSON file securely
5. Add path to `.env.local` as `FIREBASE_SERVICE_ACCOUNT_KEY`

### Razorpay Setup

1. Create account at [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to Settings → API Keys
3. Copy Key ID and Key Secret
4. Add to `.env.local`:
   ```
   RAZORPAY_KEY_ID=rzp_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   ```
5. Enable Razorpay in admin panel

### Admin Panel Initial Setup

1. Login to admin panel: `/admin/login`
2. Password: `Bankai$1000`
3. Go to Settings
4. Configure:
   - Razorpay keys
   - Winner payout percentage (default: 90%)
   - Platform commission (default: 10%)
   - Minimum withdrawal amount
   - GST percentage (default: 18%)
5. Go to Policies
6. Fill in all policies:
   - Privacy Policy
   - Terms & Conditions
   - Refund Policy
   - GST Policy
   - Support Telegram URL
7. Save changes

---

## Environment Variables Reference

```env
# Firebase Configuration
FIREBASE_API_KEY=AIzaSyDqLXsrjgMcW4dXSLQIdKLL2PEfMc2vXfI
FIREBASE_AUTH_DOMAIN=user69-83afc.firebaseapp.com
FIREBASE_DATABASE_URL=https://user69-83afc-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=user69-83afc
FIREBASE_STORAGE_BUCKET=user69-83afc.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=228502191488
FIREBASE_APP_ID=1:228502191488:web:7669f479348dc2da23d565
FIREBASE_MEASUREMENT_ID=G-BF8X15QTMD
FIREBASE_SERVICE_ACCOUNT_KEY=/path/to/serviceAccountKey.json

# Payment Gateway
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# Zappi API (Optional)
ZAPPI_API_KEY=your_zappi_api_key

# Admin
ADMIN_PASSWORD=Bankai$1000

# JWT
JWT_SECRET=your_super_secret_jwt_key

# Server
NODE_ENV=development
PORT=5000
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Database Rules Reference

Key security rules implemented:

```javascript
// Users can only read/write their own data
"users": {
  "$uid": {
    ".read": "root.child('users').child($uid).child('uid').val() === auth.uid || root.child('admins').child(auth.uid).exists()",
    ".write": "root.child('users').child($uid).child('uid').val() === auth.uid || root.child('admins').child(auth.uid).exists()"
  }
}

// Only admins can read/write admin data
"admin": {
  ".read": "root.child('admins').child(auth.uid).exists()",
  ".write": "root.child('admins').child(auth.uid).exists()"
}

// Withdrawal requests - admins only
"withdrawalRequests": {
  ".read": "root.child('admins').child(auth.uid).exists() || auth !== null",
  ".write": "auth !== null"
}
```

---

## Production Deployment Checklist

### Security
- [ ] Change admin password
- [ ] Update Firebase rules to production
- [ ] Enable HTTPS
- [ ] Setup CORS properly
- [ ] Use environment variables (never hardcode secrets)
- [ ] Enable authentication for admin panel
- [ ] Setup rate limiting
- [ ] Enable database backups

### Firebase Production Setup
1. Change database rules from test mode
2. Enable authentication requirements
3. Setup backups
4. Enable audit logging
5. Setup alerts for unusual activity

### Payment Gateway Production
1. Switch Razorpay from test to live keys
2. Setup webhook endpoints
3. Test end-to-end payment flow
4. Monitor transaction logs

### Monitoring & Analytics
- [ ] Setup Firebase Analytics
- [ ] Setup error tracking (Sentry)
- [ ] Setup performance monitoring
- [ ] Setup transaction alerts
- [ ] Regular security audits

### Backup & Recovery
- [ ] Enable Firebase backups
- [ ] Test backup restoration
- [ ] Document recovery procedures
- [ ] Setup automated backups

---

## Troubleshooting Guide

### Firebase Connection Failed
```bash
# Check if database URL is correct
echo $FIREBASE_DATABASE_URL

# Verify rules are published
# Go to Firebase Console → Realtime Database → Rules
```

### Payment Not Processing
```bash
# Check Razorpay keys
echo $RAZORPAY_KEY_ID
echo $RAZORPAY_KEY_SECRET

# Verify payment signature validation
# Backend should log errors in console
```

### Socket.io Not Connecting
```bash
# Check backend is running
curl http://localhost:5000

# Verify CORS in server.js
# Check frontend API URL matches backend
```

### Admin Panel Not Loading
1. Clear browser cache
2. Check admin token in localStorage
3. Verify admin user exists in database
4. Check admin password is correct

---

## Next Steps

1. **Customize** - Update app name, colors, branding
2. **Add Content** - Fill in policies and support links
3. **Test** - Run through complete user flow
4. **Deploy** - Deploy to production
5. **Monitor** - Setup monitoring and analytics
6. **Scale** - Optimize for more users

---

## Support

For issues:
1. Check this guide
2. Check Firebase documentation
3. Check logs: `npm run dev 2>&1 | grep -i error`
4. Contact support via Telegram

---

**Last Updated**: 2024-09-05  
**Version**: 1.0.0
