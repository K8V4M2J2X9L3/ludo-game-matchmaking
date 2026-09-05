import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import authRoutes from './routes/auth.js';
import matchmakingRoutes from './routes/matchmaking.js';
import walletRoutes from './routes/wallet.js';
import adminRoutes from './routes/admin.js';
import transactionRoutes from './routes/transactions.js';
import withdrawalRoutes from './routes/withdrawal.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Firebase Admin Init
if (!admin.apps.length) {
  admin.initializeApp({
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

const db = admin.database();
export { db, io };

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/withdrawal', withdrawalRoutes);

// Socket.io events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-matchmaking', (data) => {
    socket.emit('matchmaking-started', { message: 'Waiting for opponent...' });
    console.log('User joined matchmaking:', data);
  });

  socket.on('match-found', (data) => {
    io.emit('match-ready', data);
  });

  socket.on('game-move', (data) => {
    socket.broadcast.emit('opponent-move', data);
  });

  socket.on('game-end', (data) => {
    io.emit('game-completed', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
