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

    // Build web-based reset link
    const base = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT||4000}/reset`;
    const resetLink = `${base}?token=${rawToken}`;

    // ---- Email delivery (prefer SendGrid Web API, fallback to SMTP, else dev log) ----
const sender = process.env.SMTP_FROM || 'FitXcel <no-reply@example.com>';
const sgKey  = process.env.SENDGRID_API_KEY;

async function sendResetEmail_viaSendGrid(to, html) {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(sgKey);
  await sgMail.send({ to, from: sender, subject: 'Reset your FitXcel password', html });
}

async function sendResetEmail_viaSMTP(to, html) {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true', // false for 587 (STARTTLS)
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
    // These options often help on PaaS networks
    requireTLS: true,
    tls: { minVersion: 'TLSv1.2' },
    family: 4,           // prefer IPv4 to avoid IPv6 routing issues
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });

  await transporter.verify();
  await transporter.sendMail({
    from: sender,
    to,
    subject: 'Reset your FitXcel password',
    html,
  });
}

const html = `
  <div style="font-family: Arial, sans-serif; line-height:1.6;">
    <h2>FitXcel Password Reset</h2>
    <p>You requested to reset your password.</p>
    <p>Click the button below to set a new one (expires in ${expMin} minutes):</p>
    <p>
      <a href="${resetLink}" target="_blank"
         style="display:inline-block;padding:10px 20px;background-color:#2563eb;color:#fff;
                text-decoration:none;border-radius:6px;font-weight:600;">
        Reset Password
      </a>
    </p>
    <p>If that doesn't work, copy and paste this link into your browser:<br/>
      <a href="${resetLink}" target="_blank">${resetLink}</a>
    </p>
  </div>
`;

if (user) {
  try {
    if (sgKey) {
      await sendResetEmail_viaSendGrid(email, html);
      console.log('Email sent via SendGrid Web API');
    } else if (process.env.SMTP_HOST) {
      await sendResetEmail_viaSMTP(email, html);
      console.log('Email sent via SMTP');
    } else {
      console.log('[DEV] No email provider configured. Reset link:', resetLink);
    }
  } catch (mailErr) {
    console.error('Email send failed:', mailErr.message);
    console.log(`[DEV] Password reset link for ${email}: ${resetLink}`);
  }
} else {
  // Do nothing; still return generic OK
}

    const payload = {
      ok: true,
      message: "If that email exists, a reset link has been sent.",
    };
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
