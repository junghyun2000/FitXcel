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

// Save a full workout (all exercises + sets)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const db = await connectDB();
    const workouts = db.collection('workouts');
    const { workouts: workoutData } = req.body;

    if (!workoutData || typeof workoutData !== 'object') {
      return res.status(400).json({ error: 'Invalid workout data' });
    }

    await workouts.insertOne({
      userId: req.user.id,
      workouts: workoutData, // { "Bench Press": [...], "Squats": [...] }
      createdAt: new Date(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error saving workout:', err);
    res.status(500).json({ error: 'Failed to save workout' });
  }
});

// Get ALL workouts for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = await connectDB();
    const workouts = db.collection('workouts');

    const list = await workouts
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 }) // newest first
      .toArray();

    // Return workouts with id, date, and exercises
    res.json({
      workouts: list.map(w => ({
        id: w._id.toString(),       // unique ID for React keys
        date: w.createdAt,          // stored timestamp
        exercises: w.workouts       // { "Bench Press": [...], "Squats": [...] }
      }))
    });
  } catch (err) {
    console.error('Error fetching workouts:', err);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});


module.exports = router;
