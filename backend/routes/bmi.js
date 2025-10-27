const express = require('express');
const { ObjectId } = require('mongodb');
const connectDB = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
const COLLECTION = 'bmi_logs';

// POST /bmi  -> { ok, id, createdAt, day }
router.post('/', auth, async (req, res) => {
  try {
    const { heightCm, weightKg, age, sex, bmi, loggedAt, day } = req.body || {};

    // coerce incoming payload while guarding against NaN
    const h = Number(heightCm);
    const w = Number(weightKg);
    const a = Number(age);
    const b = Number(bmi);
    const s = String(sex || '').toLowerCase();

    if (![h, w, a, b].every(Number.isFinite)) {
      return res.status(400).json({ error: 'Invalid numeric fields' });
    }
    if (s !== 'male' && s !== 'female') {
      return res.status(400).json({ error: "sex must be 'male' or 'female'" });
    }

    // time bookkeeping
    const createdAt = loggedAt ? new Date(loggedAt) : new Date();
    if (Number.isNaN(createdAt.getTime())) {
      return res.status(400).json({ error: 'Invalid loggedAt timestamp' });
    }
    // store a day key (YYYY-MM-DD). If client provided one, use it; else derive from createdAt (UTC).
    const dayKey = (day && /^\d{4}-\d{2}-\d{2}$/.test(day))
      ? day
      : createdAt.toISOString().slice(0, 10);

    const db = await connectDB();

    // persist user-specific entry so later history fetches are filtered by userId
    const doc = {
      userId: req.user.id,
      heightCm: h,
      weightKg: w,
      age: a,
      sex: s,
      bmi: b,
      createdAt,      // Date
      day: dayKey,    // YYYY-MM-DD
    };

    const { insertedId } = await db.collection(COLLECTION).insertOne(doc);

    return res.json({
      ok: true,
      id: insertedId.toString(),
      createdAt: createdAt.toISOString(),
      day: dayKey,
    });
  } catch (err) {
    console.error('POST /bmi error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /bmi/history  -> { items: [...], nextCursor: null }
router.get('/history', auth, async (req, res) => {
  try {
    const db = await connectDB();

    const items = await db
      .collection(COLLECTION)
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(200)
      .project({
        _id: 1,
        userId: 1,
        heightCm: 1,
        weightKg: 1,
        age: 1,
        sex: 1,
        bmi: 1,
        createdAt: 1,
        day: 1,
      })
      .toArray();

    // normalize ObjectId and Date fields so the client receives serializable primitives
    const normalized = items.map((it) => ({
      ...it,
      _id: it._id instanceof ObjectId ? it._id.toString() : String(it._id),
      createdAt:
        it.createdAt instanceof Date
          ? it.createdAt.toISOString()
          : String(it.createdAt),
      day: it.day || (typeof it.createdAt === 'string'
        ? it.createdAt.slice(0, 10)
        : (it.createdAt instanceof Date ? it.createdAt.toISOString().slice(0, 10) : null)),
    }));

    return res.json({ items: normalized, nextCursor: null });
  } catch (err) {
    console.error('GET /bmi/history error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Optional: quick ping
router.get('/ping', (_req, res) => res.type('text').send('pong'));

module.exports = router;
