const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/sequelize");

const ProductDetails = sequelize.define("ProductDetails", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "products",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  sections: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: "Array of objects with heading and items: [{ heading: '', items: [] }]",
  },
}, {
  tableName: "product_details",
  timestamps: true,
});

module.exports = ProductDetails;