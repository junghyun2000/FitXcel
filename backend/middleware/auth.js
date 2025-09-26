const jwt = require('jsonwebtoken');

module.exports = async function auth(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'missing token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // we issued token with { id: user._id, email }, so:
    req.user = { id: String(payload.id), email: payload.email };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' });
  }
};