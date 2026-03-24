'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      orderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      productId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      productVariantId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'product_variants',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      productName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      priceAtPurchase: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      totalPrice: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'dispatched', 'delivered', 'cancelled', 'returned'),
        defaultValue: 'pending'
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

    await queryInterface.addIndex('order_items', ['orderId']);
    await queryInterface.addIndex('order_items', ['productId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('order_items');
  }
};
