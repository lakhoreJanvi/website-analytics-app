const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const App = sequelize.define('App', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: { type: DataTypes.STRING, allowNull: false },
    ownerEmail: { type: DataTypes.STRING },
    apiKey: { type: DataTypes.STRING, allowNull: true,},
    apiKeyHash: { type: DataTypes.STRING, unique: true }, // store hash of key
    revoked: { type: DataTypes.BOOLEAN, defaultValue: false },
    revokedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'apps',
    timestamps: false
  });

  App.associate = (models) => {
    App.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return App;
};
