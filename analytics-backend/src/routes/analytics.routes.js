const express = require('express');
const router = express.Router();
const Joi = require('joi');
const db = require('../models');
const apiKeyAuth = require('../middleware/apiKeyAuth');
const config = require('../config/config');
const redis = require('redis');
const UAParser = require('ua-parser-js');

const redisClient = redis.createClient({ url: config.redisUrl });
redisClient.connect().catch(() => { /* ignore for dev if not ready */ });

/**
 * @swagger
 * /api/analytics/collect:
 *   post:
 *     summary: Collect an analytics event
 *     tags: [Analytics]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event
 *             properties:
 *               event:
 *                 type: string
 *                 example: "login_form_cta_click"
 *               url:
 *                 type: string
 *                 example: "https://example.com/page"
 *               referrer:
 *                 type: string
 *                 example: "https://google.com"
 *               device:
 *                 type: string
 *                 example: "mobile"
 *               ipAddress:
 *                 type: string
 *                 example: "1.2.3.4"
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-11-15T19:00:00Z"
 *               userId:
 *                 type: string
 *                 example: "123"
 *               metadata:
 *                 type: object
 *                 example: { browser: "Chrome", os: "Android", screenSize: "1080x1920" }
 *     responses:
 *       201:
 *         description: Event collected successfully
 */
router.post('/collect', apiKeyAuth, async (req, res) => {
  const schema = Joi.object({
    event: Joi.string().required(),
    userId: Joi.string().optional(),
    url: Joi.string().uri().optional().allow(null, ''),
    referrer: Joi.string().uri().optional().allow(null, ''),
    device: Joi.string().optional().allow(null, ''),
    ipAddress: Joi.string().optional().allow(null, ''),
    timestamp: Joi.date().iso().optional(),
    metadata: Joi.object().optional()
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const app = req.appRecord;
  if (app.revoked) {
    return res.status(403).json({ message: 'API key revoked' });
  }
  const ua = req.headers['user-agent'] || '';
  const parser = new UAParser(ua);
  const parsedUA = parser.getResult();

  await db.Event.create({
    appId: app.id,
    eventType: value.event,
    url: value.url || '',
    referrer: value.referrer || '',
    device: value.device || parsedUA.device.model || 'unknown',
    ipAddress: value.ipAddress || '',
    timestamp: value.timestamp || new Date(),
    metadata: {
      ...(value.metadata || {}),
      browser: parsedUA.browser.name || 'unknown',
      userId: value.userId || null, 
      os: parsedUA.os.name || 'unknown',
      screenSize: parsedUA.device.model || 'unknown'
    }
  });

  const cacheKey = `event_summary:${app.id}:${value.event}`;
  await redisClient.del(cacheKey).catch(() => {});

  res.status(201).json({ message: 'Event collected' });
  return;
});

/**
 * @swagger
 * /api/analytics/event-summary:
 *   get:
 *     summary: Get summary of a specific event type
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: event
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: app_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event summary
 */
router.get("/event-summary", async (req, res) => {
  const schema = Joi.object({
    event: Joi.string().required(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    app_id: Joi.string().optional(),
  });

  const { error, value } = schema.validate(req.query);
  if (error) return res.status(400).json({ message: error.message });

  const { event, startDate, endDate, app_id } = value;
  const cacheKey = `event_summary:${app_id || "all"}:${event}:${startDate || "0"}:${endDate || "0"}`;

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
  } catch (err) {
    console.log("Cache read error:", err);
  }

  const { Op } = db.Sequelize;

  const where = { eventType: event };

  if (app_id) where.appId = app_id;

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp[Op.gte] = new Date(startDate);
    if (endDate) where.timestamp[Op.lte] = new Date(endDate);
  }

  const total = await db.Event.count({ where });

  let uniqueUsers = 0;
  try {
    uniqueUsers = await db.Event.count({
      where,
      distinct: true,
      col: db.Sequelize.literal(`metadata->>'userId'`)
    });
  } catch (err) {
    uniqueUsers = 0;
  }

  const deviceRows = await db.Event.findAll({
    where,
    attributes: [
      "device",
      [db.Sequelize.fn("COUNT", db.Sequelize.col("device")), "count"],
    ],
    group: ["device"],
    raw: true
  });

  const deviceData = {};
  deviceRows.forEach(row => {
    const dev = row.device || "unknown";
    deviceData[dev] = Number(row.count || 0);
  });

  const result = {
    event,
    count: total,
    uniqueUsers,
    deviceData,
  };

  try {
    await redisClient.setEx(cacheKey, 60, JSON.stringify(result));
  } catch (err) {
    console.log("Cache write error:", err);
  }

  res.json(result);
});

/**
 * @swagger
 * /api/analytics/user-stats:
 *   get:
 *     summary: Get user-based analytics data
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User stats results
 */
router.get('/user-stats', async (req, res) => {
  const schema = Joi.object({ userId: Joi.string().required() });
  const { error, value } = schema.validate(req.query);
  if (error) return res.status(400).json({ message: error.message });

  const { userId } = value;

  const where = {
    metadata: {
      userId: userId
    }
  };

  const events = await db.Event.findAll({
    where,
    order: [['timestamp', 'DESC']],
    limit: 50
  });

  const totalEvents = await db.Event.count({ where });

  const latest = events[0];

  const deviceDetails = latest
    ? {
        browser: latest.metadata.browser,
        os: latest.metadata.os
      }
    : {};

  const ipAddress = latest ? latest.ipAddress : null;

  res.json({
    userId,
    totalEvents,
    deviceDetails,
    ipAddress,
    recentEvents: events.map(e => ({
      id: e.id,
      eventType: e.eventType,
      timestamp: e.timestamp,
      metadata: e.metadata
    }))
  });
});

module.exports = router;