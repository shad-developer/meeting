require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const setupSocketHandlers = require('./socket');

const app = express();
const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === 'production';

// Allowed origins: in prod use the Render URL, in dev use localhost
const allowedOrigins = isProduction
  ? [process.env.CLIENT_URL].filter(Boolean)
  : ['http://localhost:3000'];

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'MeetApp Server is running 🚀', timestamp: new Date() });
});

// Serve React build in production
if (isProduction) {
  const clientBuildPath = path.join(__dirname, '../client/build');
  app.use(express.static(clientBuildPath));
  // Catch-all: send React app for any non-API route
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Socket handlers
setupSocketHandlers(io);

// MongoDB connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/meetapp';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.io ready`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = { app, server, io };
