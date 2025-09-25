const express = require('express');
const router = express.Router();
const connectDB = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
  const db = await connectDB();
  const users = db.collection('users');
  const { email, password } = req.body;
  const existing = await users.findOne({ email });
  if (existing) return res.status(400).json({ error: 'Email already exists' });
  const hashedPassword = await bcrypt.hash(password, 10);
  await users.insertOne({ email, password: hashedPassword });
  res.json({ success: true });
});

router.post('/login', async (req, res) => {
  const db = await connectDB();
  const users = db.collection('users');
  const { email, password } = req.body;
  const user = await users.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET);
  res.json({ token });
});

module.exports = router;