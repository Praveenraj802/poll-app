const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
require('dotenv').config(); // Load environment variables from .env file

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware configuration
const allowedOrigin = (process.env.FRONTEND_URL || '*').replace(/\s/g, '');
console.log(`📡 CORS Allowed Origin: "[${allowedOrigin}]"`);

app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.json()); // Parse incoming JSON requests

// Attach socket.io to request object so it can be used in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Request Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// MongoDB Connection Logic
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/polling-app';

async function connectDB() {
  console.log("⏳ Attempting to connect to MongoDB...");
  try {
    // We use mongoose.connect with Server API Version 1 for best compatibility with Atlas
    await mongoose.connect(MONGODB_URI, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      },
      connectTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Successfully connected to MongoDB!");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    console.log("Full error:", err);
    console.log("💡 Tip: Try whitelisting your IP in MongoDB Atlas (Network Access).");
  }
}

connectDB();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ User disconnected');
  });
});

// Route Registration
const pollsRouter = require('./routes/polls');
const authRouter = require('./routes/auth');
const authOTPRouter = require('./routes/authOTP'); // NEW: OTP Authentication
app.use('/api/polls', pollsRouter);
app.use('/api/auth', authRouter); // Legacy password-based auth
app.use('/api/auth-otp', authOTPRouter); // NEW: OTP-based auth


// Basic health check route
app.get('/', (req, res) => {
  res.send('Polling App API is running with Socket.io');
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
