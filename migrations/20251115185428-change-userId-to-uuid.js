'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop foreign key first
    await queryInterface.removeConstraint('apps', 'apps_userId_fkey');

    // Change column type to UUID
    await queryInterface.changeColumn('apps', 'userId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Users', // match your table name
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('apps', 'apps_userId_fkey');

    // Change back to integer if rolling back
    await queryInterface.changeColumn('apps', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  }
};
