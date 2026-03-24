const { DataTypes, Sequelize } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ShippingAddress = sequelize.define('ShippingAddress', {
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
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Full name is required'
      },
      len: {
        args: [2, 100],
        msg: 'Full name must be between 2 and 100 characters'
      }
    }
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Phone number is required'
      },
      len: {
        args: [10, 15],
        msg: 'Phone number must be between 10 and 15 characters'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: {
        msg: 'Please provide a valid email address'
      }
    }
  },
  addressLine1: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Address line 1 is required'
      }
    }
  },
  addressLine2: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'City is required'
      }
    }
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'State is required'
      }
    }
  },
  postalCode: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Postal code is required'
      },
      len: {
        args: [4, 10],
        msg: 'Postal code must be between 4 and 10 characters'
      }
    }
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'India',
    validate: {
      notEmpty: {
        msg: 'Country is required'
      }
    }
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  addressType: {
    type: DataTypes.ENUM('home', 'office', 'other'),
    defaultValue: 'home'
  }
}, {
  tableName: 'shipping_addresses',
  timestamps: true,
  paranoid: false
});

module.exports = ShippingAddress;
