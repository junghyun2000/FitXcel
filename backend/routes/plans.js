const express = require('express');
const router = express.Router();
const connectDB = require('../db');
const auth = require('../middleware/auth');
const { ObjectId } = require('mongodb');

// Add a saved meal to today’s entries
router.post('/today/add', auth, async (req, res) => {
  const { mealId, servings = 1 } = req.body || {};
  if (!mealId) return res.status(400).json({ error: 'mealId required' });

  const db = await connectDB();
  const meals = db.collection('meals');
  const entries = db.collection('entries');

  const meal = await meals.findOne({ _id: new ObjectId(mealId), userId: req.user.id });
  if (!meal) return res.status(404).json({ error: 'meal not found' });

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const servingsNum = Number(servings) || 1;

  // store snapshot calories to avoid future lookups/changes affecting history
  const caloriesAtAdd = Math.round((meal.calories || 0) * servingsNum);

  await entries.insertOne({
    userId: req.user.id,
    date: today,
    mealId: new ObjectId(mealId),
    servings: servingsNum,
    caloriesAtAdd,
    createdAt: new Date(),
  });

  res.json({ ok: true, calories: caloriesAtAdd });
});

router.get('/today/total', auth, async (req, res) => {
  const db = await connectDB();
  const entries = db.collection('entries');
  const today = new Date().toISOString().slice(0, 10);

  const agg = await entries.aggregate([
    { $match: { userId: req.user.id, date: today } },
    { $group: { _id: null, total: { $sum: '$caloriesAtAdd' } } },
  ]).toArray();

  const total = agg[0]?.total || 0;
  res.json({ date: today, total });
});

module.exports = router;