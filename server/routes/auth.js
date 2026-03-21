const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Student Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, batch, stream, password } = req.body;
    if (!name || !email || !phone || !batch || !stream || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, phone, batch, stream, passwordHash });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, stream: user.stream, batch: user.batch, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Student / Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, stream: user.stream, batch: user.batch, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify Admin Passkey (for Exam Engine gate)
router.post('/verify-passkey', (req, res) => {
  const { passkey } = req.body;
  if (passkey === process.env.ADMIN_PASSKEY) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false, message: 'Invalid passkey' });
  }
});

// Get current user profile
router.get('/me', require('../middleware/auth').authMiddleware, (req, res) => {
  res.json(req.user);
});

module.exports = router;
