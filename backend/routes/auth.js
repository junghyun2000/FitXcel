const express = require('express');
const router = express.Router();
const connectDB = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// tiny guard helper (kept same style)
function must(val, name) {
  if (!val) throw new Error(`Missing ${name}`);
}

// --- REGISTER ---
router.post('/register', async (req, res) => {
  try {
    must(process.env.JWT_SECRET, 'JWT_SECRET (.env)');
    const db = await connectDB();
    const users = db.collection('users');

    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    await users.createIndex({ email: 1 }, { unique: true });

    const existing = await users.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    await users.insertOne({
      email,
      password: hash,
      createdAt: new Date()
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('POST /auth/register error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// --- LOGIN ---
router.post('/login', async (req, res) => {
  try {
    must(process.env.JWT_SECRET, 'JWT_SECRET (.env)');
    const db = await connectDB();
    const users = db.collection('users');

    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await users.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: String(user._id), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ token });
  } catch (err) {
    console.error('POST /auth/login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * ---------- FORGOT PASSWORD ----------
 * POST /auth/forgot-password
 * body: { email }
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email is required' });

    const db = await connectDB();
    const users = db.collection('users');
    const user = await users.findOne({ email });

    const tokenBytes = Number(process.env.RESET_TOKEN_BYTES || 32);
    const rawToken = crypto.randomBytes(tokenBytes).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expMin = Number(process.env.RESET_TOKEN_EXP_MIN || 30);
    const expiresAt = new Date(Date.now() + expMin * 60 * 1000);

    if (user) {
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            passwordReset: {
              tokenHash,
              expiresAt,
              used: false,
              requestedAt: new Date()
            }
          }
        }
      );

      await users.createIndex({ 'passwordReset.tokenHash': 1 });
    }

    // ✅ Build web-based reset link
    const base =
      process.env.FRONTEND_WEB_BASE_URL ||
      'https://fitxcel.vercel.app';
    const resetLink = `${base}/ResetPassword?token=${rawToken}`;

    // ✅ Email configuration
    const smtpReady =
      process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_FROM;

    if (user && smtpReady) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.verify();
        console.log("✅ SMTP connection verified successfully.");

        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: email,
          subject: "Reset your FitXcel password",
          html: `
            <div style="font-family: Arial, sans-serif; line-height:1.6;">
              <h2>FitXcel Password Reset</h2>
              <p>You requested to reset your password.</p>
              <p>Click the button below to set a new one:</p>
              <p>
                <a href="${resetLink}" 
                   style="display:inline-block;padding:10px 20px;background-color:#2563eb;color:#fff;
                          text-decoration:none;border-radius:6px;font-weight:600;">
                  Reset Password
                </a>
              </p>
              <p>If that doesn't work, copy and paste this link into your browser:</p>
              <p><a href="${resetLink}">${resetLink}</a></p>
              <p>This link will expire in ${expMin} minutes.</p>
            </div>
          `,
        });

        console.log("✅ Email sent successfully:", info.response);
      } catch (mailErr) {
        console.error("❌ Email send failed:", mailErr.message);
        console.log(`[DEV] Password reset link for ${email}: ${resetLink}`);
      }
    } else {
      if (user) console.log(`[DEV] Password reset link for ${email}: ${resetLink}`);
    }

    const payload = {
      ok: true,
      message: "If that email exists, a reset link has been sent.",
    };
    if (process.env.NODE_ENV !== "production") {
      payload.devLink = resetLink; // show in dev console
    }
    return res.json(payload);
  } catch (err) {
    console.error("POST /auth/forgot-password error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});


/**
 * ---------- RESET PASSWORD ----------
 * POST /auth/reset-password
 * body: { token, password }
 *
 * Validates token, updates password, clears reset fields.
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) {
      return res.status(400).json({ error: 'token and password are required' });
    }

    const db = await connectDB();
    const users = db.collection('users');

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();

    const user = await users.findOne({
      'passwordReset.tokenHash': tokenHash,
      'passwordReset.used': false,
      'passwordReset.expiresAt': { $gt: now }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const newHash = await bcrypt.hash(password, 10);

    await users.updateOne(
      { _id: user._id },
      {
        $set: { password: newHash, 'passwordReset.used': true, updatedAt: new Date() },
        $unset: { /* optionally remove the whole object instead: */ /* passwordReset: "" */ }
      }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('POST /auth/reset-password error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
