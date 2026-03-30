'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('users', {

      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },

      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },

      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },

      password: {
        type: Sequelize.STRING,
        allowNull: true
      },

      googleId: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },

      authProvider: {
        type: Sequelize.ENUM('local','google'),
        defaultValue: 'local'
      },

      avatar: {
        type: Sequelize.STRING,
        allowNull: true
      },

      refreshToken: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      role: {
        type: Sequelize.ENUM('user','admin'),
        defaultValue: 'user'
      },

      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },

      lastLogin: {
        type: Sequelize.DATE
      },

      passwordResetToken: {
        type: Sequelize.STRING
      },

      passwordResetExpires: {
        type: Sequelize.DATE
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }

    });

  },

  async down(queryInterface) {

    await queryInterface.dropTable('users');

  }
};
