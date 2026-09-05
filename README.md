# 🎲 Ludo Game - Live Matchmaking Platform

A complete Ludo game platform with live matchmaking, coin system, admin panel, and real money withdrawal capabilities.

## Features

### 🎮 Player Features
- **Live Matchmaking**: Find opponents in seconds
- **Multiple Entry Fees**: Play with different coin stakes (10, 25, 50, 100 coins)
- **Real-time Gaming**: Live game board with socket.io
- **Wallet System**: Add coins via Razorpay or admin
- **Winning Coins**: Separate tracking for winnings
- **Cash Withdrawal**: Convert winning coins to real money
- **Referral Program**: Earn rewards by referring friends
- **Transaction History**: Complete audit trail of all transactions
- **User Profile**: Customizable profile with stats
- **Support System**: Telegram integration for customer support

### 👨‍💼 Admin Features
- **Complete Dashboard**: Real-time statistics and analytics
- **Settings Control**:
  - Razorpay API keys configuration
  - Zappi API integration for coin additions
  - Winner payout percentage (70%-100%)
  - Platform commission settings
  - Minimum withdrawal amount
  - GST percentage configuration
- **User Management**: View all users and their statistics
- **Withdrawal Approval**: Approve/Reject withdrawal requests
- **Policy Management**: Update all legal policies
- **Manual Coin Addition**: Add coins to user accounts
- **Secure Password Protection**: Bankai$1000 (configurable)

### 📋 Policies & Legal
- Privacy Policy
- Terms & Conditions
- Refund Policy
- GST Policy
- Support Telegram Link

## Tech Stack

### Frontend
- **Framework**: Next.js 14
- **UI Framework**: Tailwind CSS
- **Real-time Communication**: Socket.io Client
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Auth
- **HTTP Client**: Axios

### Backend
- **Framework**: Express.js
- **Real-time Server**: Socket.io
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Admin SDK
- **Payment Gateway**: Razorpay
- **Alternative Coin System**: Zappi API

### Deployment
- **Frontend**: Vercel / Netlify
- **Backend**: Heroku / Railway / DigitalOcean
- **Database**: Firebase
- **Storage**: Firebase Storage

## Installation & Setup

### Prerequisites
- Node.js v16 or higher
- Firebase Project
- Razorpay Account
- npm or yarn

### Step 1: Clone Repository
```bash
git clone https://github.com/K8V4M2J2X9L3/ludo-game-matchmaking.git
cd ludo-game-matchmaking
```

### Step 2: Install Dependencies
```bash
npm install
# or
yarn install
```

### Step 3: Configure Environment

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Update `.env.local` with your credentials:
```env
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_DATABASE_URL=your_firebase_db_url
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_id
FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

ZAPPI_API_KEY=your_zappi_api_key

ADMIN_PASSWORD=Bankai$1000

JWT_SECRET=your_jwt_secret
PORT=5000
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Step 4: Firebase Security Rules

1. Go to Firebase Console
2. Navigate to Realtime Database > Rules
3. Replace with rules from `firebase-rules.json`
4. Publish rules

### Step 5: Create Admin Account

1. Create a user account normally
2. Go to Firebase Console
3. Navigate to Realtime Database
4. Add to `/admins/{uid}` with structure:
```json
{
  "uid": "admin_firebase_uid",
  "email": "admin@example.com",
  "role": "super_admin",
  "createdAt": 1234567890
}
```

### Step 6: Run Development Server

**Terminal 1 - Backend:**
```bash
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
npm run client
# Runs on http://localhost:3000
```

## Project Structure

```
ludo-game-matchmaking/
├── pages/
│   ├── index.js                 # Home page
│   ├── auth.js                  # Login/Signup
│   ├── dashboard.js             # User dashboard
│   ├── profile.js               # User profile
│   ├── wallet.js                # Wallet management
│   ├── referral.js              # Referral system
│   ├── support.js               # Support page
│   ├── policies.js              # Policies display
│   ├── game/
│   │   └── [matchId].js        # Game board
│   ├── game-results/
│   │   └── [matchId].js        # Game results
│   └── admin/
│       ├── login.js             # Admin login
│       ├── dashboard.js         # Admin dashboard
│       ├── settings.js          # Admin settings
│       ├── withdrawals.js       # Withdrawal management
│       ├── policies.js          # Policy management
│       └── add-coins.js         # Manual coin addition
├── components/
│   ├── Navbar.js                # User navbar
│   ├── AdminNavbar.js           # Admin navbar
│   ├── WalletCard.js            # Wallet widget
│   └── MatchmakingCard.js       # Matchmaking widget
├── routes/
│   ├── auth.js                  # Authentication routes
│   ├── matchmaking.js           # Matchmaking routes
│   ├── wallet.js                # Wallet routes
│   ├── transactions.js          # Transaction routes
│   ├── withdrawal.js            # Withdrawal routes
│   └── admin.js                 # Admin routes
├── middleware/
│   └── auth.js                  # Auth middleware
├── styles/
│   └── globals.css              # Global styles
├── firebase.js                  # Firebase config
├── firebase-config.js           # Firebase admin config
├── server.js                    # Express server
├── package.json
├── next.config.js
├── tailwind.config.js
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile/:uid` - Get user profile
- `PUT /api/auth/profile/:uid` - Update profile

### Matchmaking
- `POST /api/matchmaking/create-match` - Create new match
- `POST /api/matchmaking/join-match/:matchId` - Join existing match
- `GET /api/matchmaking/available-matches` - Get available matches
- `POST /api/matchmaking/end-match/:matchId` - End match and declare winner

### Wallet
- `GET /api/wallet/balance/:uid` - Get wallet balance
- `POST /api/wallet/add-coins` - Create coin purchase order (Razorpay)
- `POST /api/wallet/verify-payment` - Verify and confirm payment
- `GET /api/wallet/transactions/:uid` - Get transaction history

### Transactions
- `GET /api/transactions/history/:uid` - Get all transactions
- `GET /api/transactions/stats/:uid` - Get transaction statistics

### Withdrawal
- `POST /api/withdrawal/request` - Request withdrawal
- `GET /api/withdrawal/requests/:uid` - Get user's withdrawal requests

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/settings` - Get admin settings
- `PUT /api/admin/settings` - Update admin settings
- `GET /api/admin/users` - Get all users
- `GET /api/admin/withdrawal-requests` - Get all withdrawal requests
- `PUT /api/admin/withdrawal-requests/:requestId` - Approve/Reject withdrawal
- `GET /api/admin/policies` - Get policies
- `PUT /api/admin/policies` - Update policies
- `POST /api/admin/add-coins` - Add coins manually
- `GET /api/admin/dashboard` - Get dashboard statistics

## Admin Panel Access

1. Navigate to `http://localhost:3000/admin/login`
2. Enter password: `Bankai$1000`
3. Access admin features

## Firebase Database Structure

```
realtimedb/
├── users/
│   └── {uid}/
│       ├── email
│       ├── displayName
│       ├── coins
│       ├── winningCoins
│       ├── stats
│       └── referralCode
├── matchmaking/
│   └── {matchId}/
│       ├── players
│       ├── entryFee
│       ├── status
│       └── winnerId
├── transactions/
│   └── {uid}/
│       └── {transactionId}
├── withdrawalRequests/
│   └── {requestId}
├── admin/
│   ├── settings
│   └── policies
├── admins/
│   └── {uid}
└── referrals/
    └── {referralId}
```

## Payment Integration

### Razorpay Setup

1. Create Razorpay account at https://razorpay.com
2. Get API keys from dashboard
3. Add to environment variables
4. Frontend will handle payment gateway
5. Backend verifies payment signature

### Zappi API Setup (Optional)

1. Get API key from Zappi
2. Add to environment variables
3. Enable in admin panel
4. Use for manual coin additions

## Deployment

### Frontend Deployment (Vercel)

```bash
npm install -g vercel
vercel login
vercel
```

Add environment variables in Vercel dashboard.

### Backend Deployment (Heroku)

```bash
heroku login
heroku create your-app-name
git push heroku main
heroku config:set FIREBASE_API_KEY=your_key
# Add all environment variables
heroku logs --tail
```

## Security Considerations

✅ **Firebase Rules**: Enforce user data isolation  
✅ **Admin Authentication**: Password-protected admin panel  
✅ **Payment Verification**: Razorpay signature validation  
✅ **Transaction Audit**: Complete transaction history  
✅ **User Isolation**: Users can only access their data  
✅ **Admin Logs**: All admin actions logged  

## Troubleshooting

### Firebase Connection Issues
- Check Firebase URL in environment variables
- Verify database is in Realtime Database mode
- Check Firebase rules are published

### Payment Gateway Errors
- Verify Razorpay keys are correct
- Check payment amount is > 0
- Ensure CORS is enabled

### Socket.io Connection
- Check backend server is running
- Verify CORS settings in socket.io configuration
- Check frontend API URL is correct

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, join our Telegram channel or contact admin@ludogame.com

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Tournament mode
- [ ] Leaderboards
- [ ] Video streaming
- [ ] AI opponent
- [ ] Social features
- [ ] Blockchain integration

## Contributors

- Developer: K8V4M2J2X9L3

---

**Admin Credentials**
- Password: `Bankai$1000`
- Access: `/admin/login`

**Note**: Change admin password in production environment!
