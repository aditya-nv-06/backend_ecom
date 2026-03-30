const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/sequelize");

const Product = sequelize.define("Product", {

  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true }
  },

  description: DataTypes.TEXT,

  brand: {
    type: DataTypes.STRING
  },

  originalPrice: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
    validate: { min: 0 }
  },

  discountPercentage: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    validate: { min: 0, max: 100 }
  },

  price: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },

  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },

  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },

  totalReviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  soldCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  categoryId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: "categories",
      key: "id"
    }
  }

},{
  tableName:"products",
  timestamps:true,

  hooks:{
    beforeSave:(product)=>{

      const original = Number(product.originalPrice);
      const discount = Number(product.discountPercentage) || 0;

      const finalPrice = original - (original * discount)/100;

      product.price = finalPrice.toFixed(2);

    }
  }

});

module.exports = Product;
