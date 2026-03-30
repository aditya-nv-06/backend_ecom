"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('payment_methods', 'type', {
      type: Sequelize.ENUM('UPI', 'Credit Card', 'Net Banking', 'Wallet', 'Other'),
      allowNull: false,
    });

    await queryInterface.addColumn('payment_methods', 'upiId', {
      type: Sequelize.STRING,
      allowNull: true, // Only required for UPI
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('payment_methods', 'type');
    await queryInterface.removeColumn('payment_methods', 'upiId');
  },
};