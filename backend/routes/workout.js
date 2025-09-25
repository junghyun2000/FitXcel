const express = require('express');
const router = express.Router();
const connectDB = require('../db');
const jwt = require('jsonwebtoken');

// Middleware to check JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Save a workout
router.post('/', authMiddleware, async (req, res) => {
  const db = await connectDB();
  const workouts = db.collection('workouts');
  const { type, duration } = req.body;

  await workouts.insertOne({
    userId: req.user.id,
    type,
    duration,
    createdAt: new Date()
  });

  res.json({ success: true });
});

// Get all workouts for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  const db = await connectDB();
  const workouts = db.collection('workouts');

  const list = await workouts
    .find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .toArray();

  res.json({ workouts: list });
});

module.exports = router;
