const express = require('express');
const db = require('../models');
const apiKeyAuth = require('../middleware/apiKeyAuth');
const { generateRawApiKey, hashApiKey } = require('../utils/apiKey');
const Joi = require('joi');
const router = require("express").Router();
const passport = require("passport");

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/api/docs/");
  }
);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new app and generate an API key
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               ownerEmail:
 *                 type: string
 *     responses:
 *       200:
 *         description: App registered successfully.
 */
router.post('/register', async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().min(2).required(),
      ownerEmail: Joi.string().email().optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const { name, ownerEmail } = value;

    const [user, created] = await db.User.findOrCreate({
      where: { email: ownerEmail },
      defaults: {
        name,
        googleId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const existingApp = await db.App.findOne({ where: { ownerEmail } });
    if (existingApp) {
      return res.status(409).json({ message: 'This email is already registered with an app' });
    }

    const rawKey = await generateRawApiKey();
    const hash = await hashApiKey(rawKey);

    const app = await db.App.create({
      name,
      ownerEmail,
      apiKeyHash: hash,
      revoked: false,
      userId: user.id,
    });

    return res.status(201).json({
      appId: app.id,
      apiKey: rawKey,
      message: 'Store the API key securely: it will not be shown again',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/api-key/{appId}:
 *   get:
 *     summary: Get API key details for a specific app
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the app
 *     responses:
 *       200:
 *         description: Successfully retrieved the app details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 ownerEmail:
 *                   type: string
 *                 revoked:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *       404:
 *         description: App not found
 *       500:
 *         description: Internal server error
 */
router.get('/api-key/:appId', async (req, res) => {
  try {
    const app = await db.App.findByPk(req.params.appId, {
      attributes: ['id', 'name', 'ownerEmail', 'revoked', 'createdAt', 'apiKeyHash']
    });

    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }

    if (app.revoked) {
      return res.status(403).json({ message: 'API key revoked' });
    }
    return res.json(app);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/revoke:
 *   post:
 *     summary: Revoke an API key
 *     tags: [API Keys]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               appId:
 *                 type: string
 *                 example: "xxx"
 *     responses:
 *       200:
 *         description: Successfully revoked
 */
router.post('/revoke', async (req, res) => {
  try {
    const { appId } = req.body;

    console.log('req.user:', req.user);
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!appId) {
      return res.status(400).json({ message: 'appId is required' });
    }

    const app = await db.App.findByPk(appId);
    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }

    if (app.revoked === true) {
      return res.status(400).json({ message: 'API key already revoked' });
    }
    
    app.revoked = true;
    app.apiKey = null;
    app.revokedAt = new Date();
    await app.save();

    return res.json({ message: 'API key revoked successfully' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;