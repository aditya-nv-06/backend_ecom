const { sequelize } = require("../config/sequelize");

// User
const User = require("./User.model");

// Product related models
const Category = require("./product/Category");
const Product = require("./product/Product");
const ProductVariant = require("./product/ProductVariant");
const ProductImage = require("./product/ProductImage");
const ProductSpecification = require("./product/ProductSpecification");
const ProductDetails = require("./product/ProductDetails");

// Other models
const Question = require("./Question");
const Review = require("./Review");
const Wishlist = require("./Wishlist");

// Cart & Checkout models
const Cart = require("./Cart");
const CartItem = require("./CartItem");
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const ShippingAddress = require("./ShippingAddress");
const Coupon = require("./Coupon");
const CouponUsage = require("./CouponUsage");

// Initialize models object
const models = {
  sequelize,
  User,
  Category,
  Product,
  ProductVariant,
  ProductImage,
  ProductSpecification,
  ProductDetails,
  Question,
  Review,
  Wishlist,
  Cart,
  CartItem,
  Order,
  OrderItem,
  ShippingAddress,
  Coupon,
  CouponUsage
};

/* ================= RELATIONSHIPS ================= */

// Category → Product
Category.hasMany(Product, { foreignKey: "categoryId", as: "products" });
Product.belongsTo(Category, { foreignKey: "categoryId", as: "productCategory" });


// Product → Images
Product.hasMany(ProductImage, {
  foreignKey: "productId",
  as: "images",
  onDelete: "CASCADE"
});

ProductImage.belongsTo(Product, {
  foreignKey: "productId",
  as: "imageProduct"
});


// Product → Specifications
Product.hasOne(ProductSpecification, {
  foreignKey: "productId",
  as: "specifications",
  onDelete: "CASCADE"
});

ProductSpecification.belongsTo(Product, {
  foreignKey: "productId",
  as: "specProduct"
});


// Product → Details
Product.hasOne(ProductDetails, {
  foreignKey: "productId",
  as: "details",
  onDelete: "CASCADE"
});

ProductDetails.belongsTo(Product, {
  foreignKey: "productId",
  as: "detailProduct"
});


// Product → Variants
Product.hasMany(ProductVariant, {
  foreignKey: "productId",
  as: "variants",
  onDelete: "CASCADE"
});

ProductVariant.belongsTo(Product, {
  foreignKey: "productId",
  as: "variantProduct"
});


/* ================= USER RELATIONS ================= */

// User → Wishlist
User.hasMany(Wishlist, {
  foreignKey: "userId",
  as: "wishlists"
});

Wishlist.belongsTo(User, {
  foreignKey: "userId",
  as: "wishlistUser"
});


// User → Reviews
User.hasMany(Review, {
  foreignKey: "userId",
  as: "reviews"
});

Review.belongsTo(User, {
  foreignKey: "userId",
  as: "reviewUser"
});


// User → Questions
User.hasMany(Question, {
  foreignKey: "userId",
  as: "questions"
});

Question.belongsTo(User, {
  foreignKey: "userId",
  as: "questionUser"
});


/* ================= PRODUCT RELATIONS ================= */

// Product → Wishlist
Product.hasMany(Wishlist, {
  foreignKey: "productId",
  as: "wishlistItems"
});

Wishlist.belongsTo(Product, {
  foreignKey: "productId",
  as: "wishlistProduct"
});


// Product → Reviews
Product.hasMany(Review, {
  foreignKey: "productId",
  as: "reviews"
});

Review.belongsTo(Product, {
  foreignKey: "productId",
  as: "reviewProduct"
});


// Product → Questions
Product.hasMany(Question, {
  foreignKey: "productId",
  as: "questions"
});

Question.belongsTo(Product, {
  foreignKey: "productId",
  as: "questionProduct"
});


/* ================= CART RELATIONS ================= */

// User → Cart
User.hasMany(Cart, { foreignKey: "userId", as: "carts" });
Cart.belongsTo(User, { foreignKey: "userId", as: "user" });

// Cart → CartItem
Cart.hasMany(CartItem, { foreignKey: "cartId", as: "items", onDelete: "CASCADE" });
CartItem.belongsTo(Cart, { foreignKey: "cartId", as: "cart" });

// CartItem → Product
CartItem.belongsTo(Product, { foreignKey: "productId", as: "product" });
Product.hasMany(CartItem, { foreignKey: "productId", as: "cartItems" });

// CartItem → ProductVariant
CartItem.belongsTo(ProductVariant, { foreignKey: "productVariantId", as: "variant" });


/* ================= ORDER RELATIONS ================= */

// User → Order
User.hasMany(Order, { foreignKey: "userId", as: "orders" });
Order.belongsTo(User, { foreignKey: "userId", as: "user" });

// Order → OrderItem
Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "orderId", as: "order" });

// OrderItem → Product
OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });
Product.hasMany(OrderItem, { foreignKey: "productId", as: "orderItems" });

// OrderItem → ProductVariant
OrderItem.belongsTo(ProductVariant, { foreignKey: "productVariantId", as: "variant" });

// Order → ShippingAddress
Order.belongsTo(ShippingAddress, { foreignKey: "shippingAddressId", as: "shippingAddress" });
ShippingAddress.hasMany(Order, { foreignKey: "shippingAddressId", as: "orders" });


/* ================= SHIPPING ADDRESS RELATIONS ================= */

// User → ShippingAddress
User.hasMany(ShippingAddress, { foreignKey: "userId", as: "shippingAddresses" });
ShippingAddress.belongsTo(User, { foreignKey: "userId", as: "user" });


/* ================= COUPON RELATIONS ================= */

// Coupon → Cart
Coupon.hasMany(Cart, { foreignKey: "couponId", as: "carts" });
Cart.belongsTo(Coupon, { foreignKey: "couponId", as: "appliedCoupon" });

// Coupon → Order
Coupon.hasMany(Order, { foreignKey: "couponId", as: "orders" });
Order.belongsTo(Coupon, { foreignKey: "couponId", as: "appliedCoupon" });

// Coupon Usage
User.hasMany(CouponUsage, { foreignKey: "userId", as: "couponUsages" });
CouponUsage.belongsTo(User, { foreignKey: "userId", as: "user" });

Coupon.hasMany(CouponUsage, { foreignKey: "couponId", as: "usages" });
CouponUsage.belongsTo(Coupon, { foreignKey: "couponId", as: "coupon" });

Order.hasOne(CouponUsage, { foreignKey: "orderId", as: "couponUsage" });
CouponUsage.belongsTo(Order, { foreignKey: "orderId", as: "order" });


module.exports = models;
