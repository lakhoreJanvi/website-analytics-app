'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('apps', 'apiKeyHash', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('apps', 'apiKeyHash');
  }
};
