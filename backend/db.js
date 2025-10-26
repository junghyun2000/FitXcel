// backend/db.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let initialized = false;
let dbInstance = null;

async function ensureIndexes(db) {
  // Enforce case-insensitive uniqueness only when emailLower exists
  await db.collection('users').createIndex(
    { emailLower: 1 },
    {
      unique: true,
      name: 'uniq_emailLower',
      // skips docs where emailLower is missing/null (prevents dup key: null)
      partialFilterExpression: { emailLower: { $type: 'string' } },
    }
  );

  // One active reset doc per user
  await db.collection('password_resets').createIndex(
    { userId: 1 },
    { unique: true, name: 'uniq_reset_user' }
  );

  // TTL: auto-remove expired reset docs
  await db.collection('password_resets').createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: 'ttl_reset_expiry' }
  );
}

async function connectDB() {
  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }
  dbInstance = client.db(process.env.MONGO_DB_NAME);

  if (!initialized) {
    await ensureIndexes(dbInstance);
    initialized = true;
  }
  return dbInstance;
}

module.exports = connectDB;
