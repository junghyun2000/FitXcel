const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const mealsRoutes = require('./routes/meals');
const plansRoutes = require('./routes/plans');
const workoutRoutes = require('./routes/workout');
const profileRoutes = require('./routes/profile');

app.use('/auth', authRoutes);
app.use('/workout', workoutRoutes);
app.use('/meals', mealsRoutes);
app.use('/plans', plansRoutes);
app.use('/profile', profileRoutes);

app.get('/__health', (req, res) => res.status(200).send('ok'));

app.get('/__whoami', (req, res) => {
  res.json({
    ts: new Date().toISOString(),
    pid: process.pid,
    cwd: process.cwd(),
    file: __filename,
    env: {
      renderServiceId: process.env.RENDER_SERVICE_ID || null,
      renderGitCommit: process.env.RENDER_GIT_COMMIT || null,
      nodeEnv: process.env.NODE_ENV || null,
    },
  });
});


// Reset page (served by backend, posts to /auth/reset-password)
app.get('/reset', (req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Reset Password • FitXcel</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; background:#0B1220; color:#fff; margin:0; }
  .wrap { max-width: 420px; margin: 8vh auto; padding: 24px; background:#111827; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,.25);}
  h1 { margin:0 0 12px; font-size:24px; }
  p { color:#cbd5e1; margin:0 0 16px; }
  label { display:block; margin:14px 0 6px; font-weight:600; }
  input { width:100%; padding:12px; border-radius:8px; border:1px solid #374151; background:#0f172a; color:#fff; }
  button { width:100%; margin-top:16px; padding:12px; border:0; border-radius:8px; font-weight:700; background:#2563eb; color:#fff; cursor:pointer; }
  .msg { margin-top:12px; font-size:14px; }
  .err { color:#fca5a5; }
  .ok  { color:#86efac; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>Reset your password</h1>
    <p>Enter a new password for your account.</p>

    <label>New password</label>
    <input id="pw1" type="password" placeholder="At least 8 characters" minlength="8" required />

    <label>Confirm password</label>
    <input id="pw2" type="password" placeholder="Re-enter password" minlength="8" required />

    <button id="btn">Update password</button>
    <div id="msg" class="msg"></div>
  </div>

<script>
(function() {
  const out = document.getElementById('msg');
  const btn = document.getElementById('btn');
  const pw1 = document.getElementById('pw1');
  const pw2 = document.getElementById('pw2');

  const params = new URLSearchParams(location.search);
  const token = params.get('token');

  function say(html, cls) { out.className = 'msg ' + (cls||''); out.innerHTML = html; }

  if (!token) { say('Invalid or missing reset link. Please request a new email.', 'err'); btn.disabled = true; return; }

  btn.addEventListener('click', async () => {
    const p1 = pw1.value.trim();
    const p2 = pw2.value.trim();
    if (p1.length < 8) return say('Password must be at least 8 characters.', 'err');
    if (p1 !== p2)   return say('Passwords do not match.', 'err');

    btn.disabled = true; say('Updating password…');
    try {
      const res = await fetch('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: p1 })
      });
      const data = await res.json();
      if (res.ok) {
        say('Password updated successfully. You can now log in.', 'ok');
      } else {
        say(data?.error || 'Unable to reset password. Your link may have expired.', 'err');
        btn.disabled = false;
      }
    } catch (e) {
      say('Network error. Please try again.', 'err');
      btn.disabled = false;
    }
  });
})();
</script>
</body>
</html>`);
});

(async () => {
  await connectDB();                 
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
})();