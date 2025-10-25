const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Import and use your auth routes
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

// --- added: universal reset redirect (works on web + native app) ---
const APP_SCHEME = process.env.APP_SCHEME || 'fitxcel';
const FRONTEND_WEB_BASE_URL =
  process.env.FRONTEND_WEB_BASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://fitxcel.vercel.app'
    : 'http://localhost:8081');


app.get('/reset', (req, res) => {
  const token = encodeURIComponent(req.query.token || '');
  const appLink = `${APP_SCHEME}://reset-password?token=${token}`;
  const webLink = `${FRONTEND_WEB_BASE_URL}/reset-password?token=${token}`;

  res.set('Content-Type', 'text/html; charset=utf-8').send(`<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Opening FitXcel…</title>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0B1220;color:#fff;margin:0}
      .card{max-width:560px;padding:24px;border-radius:12px;background:#111}
      a{color:#60a5fa}
      .muted{opacity:.75}
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Opening FitXcel…</h1>
      <p class="muted">If nothing happens, <a id="web" href="${webLink}">tap here to reset on the web</a>.</p>
    </div>
    <script>
      (function(){
        var app = ${JSON.stringify(appLink)};
        var web = ${JSON.stringify(webLink)};
        try { window.location.href = app; } catch(e) {}
        setTimeout(function(){ window.location.replace(web); }, 1500);
      })();
    </script>
    <noscript><meta http-equiv="refresh" content="0;url=${webLink}" /></noscript>
  </body>
</html>`);
});
// --- end added ---

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
