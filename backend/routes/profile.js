const express = require("express");
const router = express.Router();
const connectDB = require("../db");
const auth = require("../middleware/auth");
const { ObjectId } = require("mongodb");

// Leveling system constants
const BASE_XP = 100;
const SCALING = 20;
const thresholdFor = (level) =>
  BASE_XP + (Math.max(1, Number(level) || 1) - 1) * SCALING;

// Default profile if none exists yet
function defaultProfile(userId) {
  return {
    userId: new ObjectId(userId),
    experience: 0,
    level: 1,
    levelPoints: 0,
    stats: { strength: 10, stamina: 10, agility: 10 },
    tasks: [
      { id: 1, name: "Complete 10 push-ups", xp: 50, done: false },
      { id: 2, name: "Run for 15 minutes", xp: 50, done: false },
      { id: 3, name: "Stretch for 5 minutes", xp: 30, done: false },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Apply XP + handle level ups
function applyXp(profile, amount) {
  let exp = profile.experience || 0;
  let lvl = profile.level || 1;
  let lp = profile.levelPoints || 0;
  let toAdd = Number(amount) || 0;

  while (toAdd > 0) {
    const need = thresholdFor(lvl) - exp;
    if (toAdd >= need) {
      toAdd -= need;
      exp = 0;
      lvl += 1;
      lp += 1; // earn a level point on level-up
    } else {
      exp += toAdd;
      toAdd = 0;
    }
  }
  return { experience: exp, level: lvl, levelPoints: lp };
}

// GET /profile, fetch or create profile
router.get("/", auth, async (req, res) => {
  const db = await connectDB();
  const profiles = db.collection("profiles");

  let profile = await profiles.findOne({ userId: new ObjectId(req.user.id) });
  if (!profile) {
    profile = defaultProfile(req.user.id);
    await profiles.insertOne(profile);
  } else if (!profile.tasks || profile.tasks.length === 0) {
    profile.tasks = defaultProfile(req.user.id).tasks;
    await profiles.updateOne(
      { userId: new ObjectId(req.user.id) },
      { $set: { tasks: profile.tasks, updatedAt: new Date() } }
    );
  }

  res.json(profile);
});

// POST /profile, add XP OR upgrade stat
router.post("/", auth, async (req, res) => {
  const db = await connectDB();
  const profiles = db.collection("profiles");

  let profile = await profiles.findOne({ userId: new ObjectId(req.user.id) });
  if (!profile) {
    profile = defaultProfile(req.user.id);
    await profiles.insertOne(profile);
  }

  const { xp, upgrade } = req.body || {};

  // Case 1: XP gain
  if (xp && Number(xp) > 0) {
    const next = applyXp(profile, Number(xp));
    await profiles.updateOne(
      { userId: new ObjectId(req.user.id) },
      { $set: { ...next, updatedAt: new Date() } }
    );
  }

  // Case 2: Stat upgrade
  if (upgrade && ["strength", "stamina", "agility"].includes(upgrade)) {
    if (profile.levelPoints > 0) {
      profile.stats[upgrade] = (profile.stats[upgrade] || 0) + 1;
      profile.levelPoints -= 1;

      await profiles.updateOne(
        { userId: new ObjectId(req.user.id) },
        {
          $set: {
            stats: profile.stats,
            levelPoints: profile.levelPoints,
            updatedAt: new Date(),
          },
        }
      );
    } else {
      return res.status(400).json({ error: "Not enough level points" });
    }
  }

  const updated = await profiles.findOne({ userId: new ObjectId(req.user.id) });
  res.json(updated);
});

module.exports = router;
