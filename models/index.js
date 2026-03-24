const { sequelize } = require('../config/sequelize');



const User = require('./User.model');

// Products
const Category =require("../models/product/Category");
const Product = require("./product/Product");
const ProductVariant = require("../models/product/ProductVariant");
const ProductImage= require("../models/product/ProductImage");
const ProductSpecification = require("./product/ProductSpecification");

// Other models
const Question = require("./Question");
const Review = require("./Review");
const Wishlist = require("./Wishlist");

// Cart and Order models
const Cart = require("./Cart");
const CartItem = require("./CartItem");
const ShippingAddress = require("./ShippingAddress");
const Order = require("./Order");
const OrderItem = require("./OrderItem");

// Initialize models
const models = {
  User,
  Category,
  Product,
  ProductVariant,
  ProductImage,
  ProductSpecification,
  Question,
  Review,
  Wishlist,
  Cart,
  CartItem,
  ShippingAddress,
  Order,
  OrderItem,
  sequelize
};

// Set up associations here if needed
// Example: User.hasMany(Order);

//Category -> Product
Category.hasMany( Product ,{foreignKey: "categoryId"})
Product.belongsTo(Category,{foreignKey: "categoryId"})


// Product → Images
Product.hasMany(ProductImage, {
  foreignKey: "productId",
  as: "images",
  onDelete: "CASCADE",
  hooks: true,
});
ProductImage.belongsTo(Product, { foreignKey: "productId", as: "product" });

// Product → Specifications (ONE)
Product.hasOne(ProductSpecification, {
  foreignKey: "productId",
  as: "specifications",
  onDelete: "CASCADE",
  hooks: true,
});
ProductSpecification.belongsTo(Product, { foreignKey: "productId", as: "product" });

// Product → Variants
Product.hasMany(ProductVariant, {
  foreignKey: "productId",
  as: "variants",
  onDelete: "CASCADE",
  hooks: true,
});
ProductVariant.belongsTo(Product, { foreignKey: "productId", as: "product" });

// Wishlist associations
Wishlist.belongsTo(Product, { foreignKey: "productId", as: "product" });
Wishlist.belongsTo(User, { foreignKey: "userId", as: "user" });

//Review associations
Review.associate = (models) => {
  Review.belongsTo(models.User, {
    foreignKey: "userId",
    as: "user"
  });

  Review.belongsTo(models.Product, {
    foreignKey: "productId",
    as: "product"
  });
};

// User -> Cart (One to One)
User.hasOne(Cart, {
  foreignKey: 'userId',
  as: 'cart',
  onDelete: 'CASCADE',
  hooks: true
});
Cart.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Cart -> CartItems (One to Many)
Cart.hasMany(CartItem, {
  foreignKey: 'cartId',
  as: 'items',
  onDelete: 'CASCADE',
  hooks: true
});
CartItem.belongsTo(Cart, {
  foreignKey: 'cartId',
  as: 'cart'
});

// CartItem -> Product
CartItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});
Product.hasMany(CartItem, {
  foreignKey: 'productId',
  as: 'cartItems'
});

// CartItem -> ProductVariant
CartItem.belongsTo(ProductVariant, {
  foreignKey: 'productVariantId',
  as: 'variant'
});
ProductVariant.hasMany(CartItem, {
  foreignKey: 'productVariantId',
  as: 'cartItems'
});


// User -> ShippingAddress (One to Many)
User.hasMany(ShippingAddress, {
  foreignKey: 'userId',
  as: 'shippingAddresses',
  onDelete: 'CASCADE',
  hooks: true
});
ShippingAddress.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});


// User -> Order (One to Many)
User.hasMany(Order, {
  foreignKey: 'userId',
  as: 'orders',
  onDelete: 'CASCADE',
  hooks: true
});
Order.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Order -> ShippingAddress
Order.belongsTo(ShippingAddress, {
  foreignKey: 'shippingAddressId',
  as: 'shippingAddress'
});
ShippingAddress.hasMany(Order, {
  foreignKey: 'shippingAddressId',
  as: 'orders'
});

// Order -> OrderItems (One to Many)
Order.hasMany(OrderItem, {
  foreignKey: 'orderId',
  as: 'items',
  onDelete: 'CASCADE',
  hooks: true
});
OrderItem.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order'
});

// OrderItem -> Product
OrderItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});
Product.hasMany(OrderItem, {
  foreignKey: 'productId',
  as: 'orderItems'
});

// OrderItem -> ProductVariant
OrderItem.belongsTo(ProductVariant, {
  foreignKey: 'productVariantId',
  as: 'variant'
});
ProductVariant.hasMany(OrderItem, {
  foreignKey: 'productVariantId',
  as: 'orderItems'
});


// Call associate methods if they exist
if (Question.associate) Question.associate(models);
if (Review.associate) Review.associate(models);

module.exports = models;
