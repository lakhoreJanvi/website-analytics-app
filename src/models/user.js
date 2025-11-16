module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    googleId: { type: DataTypes.STRING, unique: true },
    name: DataTypes.STRING,
    email: { type: DataTypes.STRING, unique: true },
    avatar: DataTypes.STRING,
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'users',
    timestamps: false,
  });

  User.associate = (models) => {
    User.hasMany(models.App, { foreignKey: "userId" });
  };

  return User;
};
