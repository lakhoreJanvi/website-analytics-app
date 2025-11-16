'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('apps', 'revokedAt', {
      type: Sequelize.DATE,
      allowNull: true,  // optional, nullable column
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('apps', 'revokedAt');
  }
};
