const db = require('../models');
const { verifyApiKeyHash } = require('../utils/apiKey');

/**
 * Middleware to authenticate requests using x-api-key header.
 * After success, sets req.appRecord to the App DB row.
 */
async function apiKeyAuth(req, res, next) {
  try {
    const rawKey = req.header('x-api-key');
    if (!rawKey) return res.status(401).json({ message: 'Missing API key' });

    const apps = await db.App.findAll();
    for (const app of apps) {
      const ok = await verifyApiKeyHash(rawKey, app.apiKeyHash || '');
      if (ok) {
        req.appRecord = app;
        return next();
      }
    }
    return res.status(401).json({ message: 'Invalid API key' });
  } catch (err) {
    console.error('apiKeyAuth error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = apiKeyAuth;
