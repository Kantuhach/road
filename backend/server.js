const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const WebSocketServer = require('./websocketServer');

// Import routes
const authRoutes = require('./routes/auth');
const accidentRoutes = require('./routes/accidents');
const hotspotRoutes = require('./routes/hotspots');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // For photo uploads
app.use(express.urlencoded({ extended: true }));

// Static files for uploaded photos
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accidents', accidentRoutes);
app.use('/api/hotspots', hotspotRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    websocket: 'running on port 8080'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found` 
  });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/road-accident-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  
  // Start HTTP server
  server.listen(PORT, () => {
    console.log(`HTTP Server running on port ${PORT}`);
    
    // Start WebSocket server
    const wsServer = new WebSocketServer();
    wsServer.start();
    
    // Start cleanup interval
    wsServer.startCleanupInterval();
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

module.exports = app;
