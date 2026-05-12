const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required'
      });
    }

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        email: user.email || ''
      },
      message: 'Login successful'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed', message: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Username and password are required'
      });
    }

    const taken = await User.findOne({ username: username.trim().toLowerCase() });
    if (taken) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'Username is already taken'
      });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await User.create({
      username: username.trim().toLowerCase(),
      passwordHash,
      email: email || '',
      role: 'driver'
    });

    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        email: user.email || ''
      },
      message: 'Registration successful'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed', message: err.message });
  }
});

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      error: 'No token provided',
      message: 'Access token is required'
    });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Token is invalid or expired'
    });
  }
};

router.get('/me', verifyToken, (req, res) => {
  res.json({
    user: req.user,
    message: 'Current user retrieved successfully'
  });
});

router.post('/logout', (_req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router;
module.exports.verifyToken = verifyToken;
