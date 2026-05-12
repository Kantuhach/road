const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Mock user database (in production, use real database)
const users = [
  {
    id: 1,
    username: 'driver1',
    password: 'password123',
    role: 'driver'
  },
  {
    id: 2,
    username: 'rtsa_admin',
    password: 'rtsa2024!',
    role: 'admin'
  }
];

// POST login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Find user
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ 
      error: 'Invalid credentials',
      message: 'Username or password is incorrect' 
    });
  }

  // Generate JWT token
  const token = jwt.sign(
    { 
      userId: user.id,
      username: user.username,
      role: user.role 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    },
    message: 'Login successful'
  });
});

// POST register
router.post('/register', (req, res) => {
  const { username, password, email } = req.body;

  // Validation
  if (!username || !password) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      message: 'Username and password are required' 
    });
  }

  // Check if user already exists
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(409).json({ 
      error: 'User already exists',
      message: 'Username is already taken' 
    });
  }

  // Create new user (in production, save to database)
  const newUser = {
    id: users.length + 1,
    username,
    password, // In production, hash this password
    email: email || '',
    role: 'driver'
  };

  users.push(newUser);

  // Generate JWT token
  const token = jwt.sign(
    { 
      userId: newUser.id,
      username: newUser.username,
      role: newUser.role 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );

  res.status(201).json({
    success: true,
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role
    },
    message: 'Registration successful'
  });
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'No token provided',
      message: 'Access token is required' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Invalid token',
      message: 'Token is invalid or expired' 
    });
  }
};

// GET current user
router.get('/me', verifyToken, (req, res) => {
  res.json({
    user: req.user,
    message: 'Current user retrieved successfully'
  });
});

// POST logout
router.post('/logout', (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // by removing the token from client storage
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router;
