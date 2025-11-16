const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Event = sequelize.define('Event', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    appId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    eventType: { type: DataTypes.STRING, allowNull: false },
    url: { type: DataTypes.STRING },
    referrer: { type: DataTypes.STRING },
    device: { type: DataTypes.STRING },
    ipAddress: { type: DataTypes.STRING },
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    metadata: { type: DataTypes.JSONB }
  }, {
    tableName: 'events',
    timestamps: false,
    indexes: [
      { fields: ['eventType'] },
      { fields: ['timestamp'] },
      { fields: ['appId'] }
    ]
  });

  Event.associate = (models) => {
    Event.belongsTo(models.App, { foreignKey: 'appId', as: 'app' });
  };
  
  return Event;
};
