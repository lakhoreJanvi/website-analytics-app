'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'userId' column to 'apps' table
    await queryInterface.addColumn('apps', 'userId', {
      type: Sequelize.INTEGER,       // Use UUID if your users table uses UUIDs
      allowNull: true,            // Set false if every app must have a user
      references: {
        model: 'Users',           // name of the referenced table
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove 'userId' column if rolling back
    await queryInterface.removeColumn('apps', 'userId');
  }
};
