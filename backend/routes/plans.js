const express = require('express');
const router = express.Router();
const connectDB = require('../db');
const auth = require('../middleware/auth');
const { ObjectId } = require('mongodb');
const cors = require('cors');

console.log("✅ plans.js routes loaded");

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

router.get('/today/entries', auth, async (req, res) => {
  const db = await connectDB();
  const entries = db.collection('entries');
  const today = new Date().toISOString().slice(0, 10);

  const data = await entries.aggregate([
    { $match: { userId: req.user.id, date: today } },
    {
      $lookup: {
        from: 'meals',
        localField: 'mealId',
        foreignField: '_id',
        as: 'mealInfo',
      }
    },
    {
      $addFields: {
        meal: { $arrayElemAt: ['$mealInfo', 0] }
      }
    },
    {
      $project: {
        _id: 1,
        calories: '$caloriesAtAdd',
        mealType: {
          $ifNull: ['$meal.mealType', '$mealType']
        },
        name: {
          $ifNull: ['$meal.name', '$name']
        },
        time: '$createdAt'
      }
    }
  ]).toArray();

  res.json({ entries: data });
});

router.post('/today/manual', auth, async (req, res) => {
  const { name, calories, mealType = 'snack' } = req.body || {};

  if (!name || !calories || calories <= 0) {
    return res.status(400).json({ error: 'Name and positive calories required' });
  }

  const db = await connectDB();
  const entries = db.collection('entries');

  const today = new Date().toISOString().slice(0, 10);

  const result = await entries.insertOne({
    userId: req.user.id,
    date: today,
    mealId: null, // not tied to a saved meal
    name: name.trim(),
    caloriesAtAdd: Math.round(calories),
    mealType,
    createdAt: new Date(),
  });

  res.json({ ok: true, id: result.insertedId.toString() });
});

router.delete('/today/reset', auth, async (req, res) => {
  const db = await connectDB();
  const entries = db.collection('entries');
  const today = new Date().toISOString().slice(0, 10);

  const result = await entries.deleteMany({
    userId: req.user.id,
    date: today,
  });

  res.json({ ok: true, deleted: result.deletedCount });
});

router.post('/today/add-custom', auth, async (req, res) => {
  const { name, calories, mealType = 'snack', servings = 1 } = req.body || {};
  const kcal = Math.round(Number(calories || 0));
  if (!name || !kcal || kcal <= 0) {
    return res.status(400).json({ error: 'name and positive calories required' });
  }

  const db = await connectDB();
  const entries = db.collection('entries');

  const entry = {
    userId: req.user.id,
    date: new Date().toISOString().slice(0, 10),
    name: String(name).trim(),
    caloriesAtAdd: kcal,
    mealType,
    servings: Number(servings),
    createdAt: new Date(),
    };

  const result = await entries.insertOne(entry);
  res.json({ ok: true, entryId: result.insertedId });
});

router.delete('/today/entry/:id', auth, async (req, res) => {
  const db = await connectDB();
  const entries = db.collection('entries');
  const result = await entries.deleteOne({
    _id: new ObjectId(req.params.id),
    userId: req.user.id,
  });
  res.json({ ok: true, deleted: result.deletedCount });
});

router.get(
  '/history',
  cors({
    origin: [
      'http://localhost:19006',
      'http://127.0.0.1:19006',
      'http://localhost:8081',
      'https://fitxcel.onrender.com',
    ],
    methods: ['GET'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
  auth,
  async (req, res) => {
    try {
      const db = await connectDB();
      const entries = req.db.collection('entries');
      const userId = req.user.id;

      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      console.log('📦 /plans/history for user:', userId);
      console.log('📅 cutoff (30 days ago):', thirtyDaysAgo.toISOString());

      const data = await entries
        .find({
          $or: [{ userId: req.user.id }, { userId: String(req.user._id) }],
          createdAt: { $gte: thirtyDaysAgo },
        })
        .sort({ createdAt: -1 })
        .toArray();

      console.log('✅ entries found:', data.length);
      res.json({ history: data });
    } catch (err) {
      console.error('❌ Error fetching history:', err);
      res.status(500).json({ error: 'Failed to fetch calorie history' });
    }
  }
);

module.exports = router;