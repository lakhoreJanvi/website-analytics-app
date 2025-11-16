const express = require('express');
const helmet = require('helmet');
const bodyParser = require('express').json;
const config = require('./config/config');
const db = require('./models');
const session = require("express-session");
const passport = require("passport");
require("./config/passport");

const authRoutes = require('./routes/auth.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const limiter = require('./middleware/rateLimiter');

const app = express();

app.use(helmet());
app.use(bodyParser());
app.use(limiter);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

const setupSwagger = require('./swagger');
setupSwagger(app);

const start = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('DB connected');

    await db.sequelize.sync();
    app.listen(config.port, () => {
      console.log(`Server listening on port ${config.port}`);
    });
  } catch (err) {
    console.error('Failed to start', err);
    process.exit(1);
  }
};

start();

module.exports = app;
