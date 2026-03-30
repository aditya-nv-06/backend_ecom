const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/sequelize");

const ProductSpecification = sequelize.define("ProductSpecification", {
 
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  specifications: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }

}, {
  tableName: "product_specifications",
  timestamps: true
});

module.exports = ProductSpecification;
