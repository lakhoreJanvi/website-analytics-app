const rateLimit = require('express-rate-limit');
const config = require('../config/config');

const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  handler: (req, res) => {
    res.status(429).json({ message: 'Too many requests' });
  }
});

module.exports = limiter;
