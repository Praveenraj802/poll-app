const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware configuration
const allowedOrigin = (process.env.FRONTEND_URL || '*').replace(/\s/g, '');
console.log(`📡 CORS Allowed Origin: "[${allowedOrigin}]"`);

app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));
app.use(express.json()); // Parse incoming JSON requests

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

// Route Registration
const pollsRouter = require('./routes/polls');
const authRouter = require('./routes/auth');
app.use('/api/polls', pollsRouter);
app.use('/api/auth', authRouter);

// Basic health check route
app.get('/', (req, res) => {
  res.send('Polling App API is running');
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
