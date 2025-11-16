require("dotenv").config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors'); 
const config = require('./config/config');
const db = require('./models');
const authRoutes = require('./routes/auth.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const rateLimiter = require('./middleware/rateLimiter');
const setupSwagger = require('./swagger');
const session = require("express-session");
const passport = require("./config/passport");

const app = express();
app.use(helmet());
app.use(express.json());
app.use(rateLimiter);

app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

setupSwagger(app);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

async function initDb() {
  await db.sequelize.authenticate();
  await db.sequelize.sync({ alter: true });
  console.log('DB synced');
}
app.initDb = initDb;

module.exports = app;
