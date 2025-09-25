const express = require('express');
const router = express.Router();
const connectDB = require('../db');
const jwt = require('jsonwebtoken');

// Middleware to check JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']; // Get the "Authorization" header
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  // Extract the token (format is usually "Bearer <token>")
  const token = authHeader.split(' ')[1];

  // Verify the token using the secret
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });

    req.user = user; // Attach decoded user info to the request
    next(); // Continue to the next route handler
  });
}


// Save a full workout (POST /workout)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const db = await connectDB(); // Connect to MongoDB
    const workouts = db.collection('workouts'); // Reference the "workouts" collection
    const { workouts: workoutData } = req.body; // Extract "workouts" from the request body

    // Validate that workoutData is provided and is an object
    if (!workoutData || typeof workoutData !== 'object') {
      return res.status(400).json({ error: 'Invalid workout data' });
    }

    // Insert new workout into the database
    await workouts.insertOne({
      userId: req.user.id,   // Link workout to logged-in user
      workouts: workoutData, // Example: { "Bench Press": [...], "Squats": [...] }
      createdAt: new Date(), // Timestamp of creation
    });

    res.json({ success: true }); // Respond with success
  } catch (err) {
    console.error('Error saving workout:', err);
    res.status(500).json({ error: 'Failed to save workout' });
  }
});


// Get ALL workouts (GET /workout)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = await connectDB(); // Connect to MongoDB
    const workouts = db.collection('workouts');

    // Find all workouts for the logged-in user, newest first
    const list = await workouts
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 }) // Sort by date, newest first
      .toArray();

    // Return workouts in a simplified format for the frontend
    res.json({
      workouts: list.map(w => ({
        id: w._id.toString(),  // Convert Mongo ObjectId to string for React keys
        date: w.createdAt,     // Workout creation date
        exercises: w.workouts, // Exercise data { "Bench Press": [...], "Squats": [...] }
      }))
    });
  } catch (err) {
    console.error('Error fetching workouts:', err);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

module.exports = router;
