const { DataTypes, Sequelize } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  totalItems: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'carts',
  timestamps: true,
  paranoid: false
});

module.exports = Cart;
