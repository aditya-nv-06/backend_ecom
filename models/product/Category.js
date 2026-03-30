const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/sequelize");

const Category = sequelize.define("Category", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,

    set(value) {
      this.setDataValue(
        "name",
        value.trim().toLowerCase()
      );
    },

    validate: {
      notEmpty: true
    }
  },

  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  image: {
    type: DataTypes.STRING,
    allowNull: true
  }

}, {
  tableName: "categories",
  timestamps: true,
  hooks: {
    beforeValidate: (category) => {
      // Auto-generate slug from name if not provided
      if (category.name && !category.slug) {
        category.slug = category.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }
    }
  }
});

module.exports = Category;
