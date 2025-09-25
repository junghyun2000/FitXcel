const express = require('express');
const router = express.Router();
const connectDB = require('../db');
const auth = require('../middleware/auth');
const { ObjectId } = require('mongodb');

// List saved meals for the logged-in user
router.get('/', auth, async (req, res) => {
  const db = await connectDB();
  const meals = db.collection('meals');
  const docs = await meals
    .find({ userId: req.user.id })
    .sort({ _id: -1 })
    .project({ userId: 0 })
    .toArray();
  res.json(docs.map(d => ({ ...d, id: d._id })));
});

// Create a saved meal
router.post('/', auth, async (req, res) => {
  const { name, calories, mealType } = req.body || {};
  const kcal = Math.round(Number(calories || 0));
  if (!name || !kcal || kcal <= 0) {
    return res.status(400).json({ error: 'name and positive calories required' });
  }
  const db = await connectDB();
  const meals = db.collection('meals');
  const result = await meals.insertOne({
    userId: req.user.id,
    name: String(name).trim(),
    calories: kcal,
    mealType: mealType || 'snack',
    createdAt: new Date(),
  });
  res.json({ id: result.insertedId });
});

// Delete a saved meal (only owner)
router.delete('/:id', auth, async (req, res) => {
  const db = await connectDB();
  const meals = db.collection('meals');
  const { id } = req.params;
  await meals.deleteOne({ _id: new ObjectId(id), userId: req.user.id });
  res.json({ ok: true });
});

module.exports = router;