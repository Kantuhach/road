const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken, requireAdmin, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username or email and password are required'
      });
    }

    const identifier = username.trim().toLowerCase();
    if (!identifier) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username or email and password are required'
      });
    }

    let user = await User.findOne({ username: identifier });
    if (!user) {
      user = await User.findOne({ email: identifier });
    }
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username/email or password is incorrect'
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

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email?.trim().toLowerCase() || '';

    const takenUser = await User.findOne({ username: normalizedUsername });
    if (takenUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'Username is already taken'
      });
    }

    if (normalizedEmail) {
      const takenEmail = await User.findOne({ email: normalizedEmail });
      if (takenEmail) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'Email is already registered'
        });
      }
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await User.create({
      username: normalizedUsername,
      passwordHash,
      email: normalizedEmail,
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

router.get('/users', verifyToken, requireAdmin, async (_req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ username: 1 }).lean();
    res.json(
      users.map((u) => ({
        id: u._id.toString(),
        username: u.username,
        email: u.email || '',
        role: u.role,
        createdAt: u.createdAt
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, role = 'driver' } = req.body || {};
    const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedUsername || !password || !normalizedEmail) {
      return res.status(400).json({
        message: 'Username, email, and password are required.'
      });
    }

    if (!['driver', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be driver or admin.' });
    }

    if (await User.findOne({ username: normalizedUsername })) {
      return res.status(409).json({ message: 'Username already taken.' });
    }
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ message: 'Email already in use.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      role
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Could not create user.' });
  }
});

module.exports = router;
