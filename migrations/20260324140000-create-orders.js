'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      orderNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      shippingAddressId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'shipping_addresses',
          key: 'id'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      totalPrice: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      shippingCost: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      taxAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      discountAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      finalAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM(
          'pending',
          'confirmed',
          'processing',
          'shipped',
          'delivered',
          'cancelled',
          'returned'
        ),
        defaultValue: 'pending'
      },
      paymentStatus: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending'
      },
      paymentMethod: {
        type: Sequelize.ENUM('credit_card', 'debit_card', 'upi', 'net_banking', 'wallet', 'cod'),
        defaultValue: 'cod'
      },
      paymentId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      estimatedDeliveryDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cancelledAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cancelReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('orders', ['userId']);
    await queryInterface.addIndex('orders', ['orderNumber']);
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['paymentStatus']);
    await queryInterface.addIndex('orders', ['createdAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orders');
  }
};
