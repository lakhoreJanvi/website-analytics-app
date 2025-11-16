const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config');

const basename = path.basename(__filename);
const db = {};

const sequelize = config.databaseUrl
  ? new Sequelize(config.databaseUrl, {
      logging: config.nodeEnv === 'development' ? console.log : false,
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: config.nodeEnv === 'development' ? console.log : false,
      }
    );

fs.readdirSync(__dirname)
  .filter((file) => file !== basename && file.endsWith('.js'))
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

if (db.App && db.Event) {
  db.App.hasMany(db.Event, { foreignKey: 'appId' });
  db.Event.belongsTo(db.App, { foreignKey: 'appId' });
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
