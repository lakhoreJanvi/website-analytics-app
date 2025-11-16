const crypto = require('crypto');
const bcrypt = require('bcryptjs');

async function generateRawApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

async function hashApiKey(rawKey) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(rawKey, salt);
}

async function verifyApiKeyHash(rawKey, hash) {
  return bcrypt.compare(rawKey, hash);
}

module.exports = { generateRawApiKey, hashApiKey, verifyApiKeyHash };
