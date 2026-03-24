const { Cart, CartItem, Product, ProductVariant, User } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const messages = require('../constants/messages');
const { sequelize } = require('../config/sequelize');

/**
 * Get user's cart
 * GET /api/cart
 */
const getCart = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  let cart = await Cart.findOne({
    where: { userId, isActive: true },
    include: [
      {
        model: CartItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price', 'stock', 'originalPrice', 'discountPercentage']
          },
          {
            model: ProductVariant,
            as: 'variant',
            attributes: ['id', 'name', 'sku', 'stock']
          }
        ]
      }
    ]
  });

  // Create cart if it doesn't exist
  if (!cart) {
    cart = await Cart.create({ userId, totalPrice: 0, totalItems: 0, isActive: true });
  }

  res.status(200).json({
    status: 'success',
    data: {
      cart
    }
  });
});

/**
 * Add item to cart
 * POST /api/cart/add
 */
const addToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity, productVariantId } = req.body;
  const userId = req.user.id;

  // Validation
  if (!productId) {
    return next(new AppError('Product ID is required', 400));
  }
  if (!quantity || quantity < 1) {
    return next(new AppError('Quantity must be at least 1', 400));
  }

  // Check if product exists and is active
  const product = await Product.findByPk(productId);
  if (!product || !product.isActive) {
    return next(new AppError('Product not found or is inactive', 404));
  }

  // Check stock availability
  if (productVariantId) {
    const variant = await ProductVariant.findByPk(productVariantId);
    if (!variant) {
      return next(new AppError('Product variant not found', 404));
    }
    if (variant.stock < quantity) {
      return next(new AppError(`Only ${variant.stock} items available for this variant`, 400));
    }
  } else {
    if (product.stock < quantity) {
      return next(new AppError(`Only ${product.stock} items available`, 400));
    }
  }

  // Get or create cart
  let cart = await Cart.findOne({ where: { userId, isActive: true } });
  if (!cart) {
    cart = await Cart.create({ userId, totalPrice: 0, totalItems: 0, isActive: true });
  }

  // Check if item already exists in cart
  const existingCartItem = await CartItem.findOne({
    where: {
      cartId: cart.id,
      productId,
      productVariantId: productVariantId || null
    }
  });

  let cartItem;
  const itemPrice = parseFloat(product.price);

  if (existingCartItem) {
    const newQuantity = existingCartItem.quantity + quantity;
    
    // Check if new quantity exceeds stock
    if (productVariantId) {
      const variant = await ProductVariant.findByPk(productVariantId);
      if (variant.stock < newQuantity) {
        return next(
          new AppError(
            `Cannot add more items. Maximum ${variant.stock} available`,
            400
          )
        );
      }
    } else {
      if (product.stock < newQuantity) {
        return next(
          new AppError(
            `Cannot add more items. Maximum ${product.stock} available`,
            400
          )
        );
      }
    }

    cartItem = await existingCartItem.update({
      quantity: newQuantity,
      totalPrice: newQuantity * itemPrice
    });
  } else {
    cartItem = await CartItem.create({
      cartId: cart.id,
      productId,
      productVariantId: productVariantId || null,
      quantity,
      price: itemPrice,
      totalPrice: quantity * itemPrice
    });
  }

  // Update cart totals
  const cartItems = await CartItem.findAll({ where: { cartId: cart.id } });
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);

  await cart.update({ totalItems, totalPrice });

  // Fetch updated cart
  const updatedCart = await Cart.findByPk(cart.id, {
    include: [
      {
        model: CartItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price', 'stock', 'originalPrice', 'discountPercentage']
          },
          {
            model: ProductVariant,
            as: 'variant',
            attributes: ['id', 'name', 'sku', 'stock']
          }
        ]
      }
    ]
  });

  res.status(201).json({
    status: 'success',
    message: 'Item added to cart successfully',
    data: {
      cart: updatedCart
    }
  });
});

/**
 * Update cart item quantity
 * PUT /api/cart/update/:cartItemId
 */
const updateCartItem = catchAsync(async (req, res, next) => {
  const { cartItemId } = req.params;
  const { quantity } = req.body;
  const userId = req.user.id;

  // Validation
  if (!quantity || quantity < 1) {
    return next(new AppError('Quantity must be at least 1', 400));
  }

  const cartItem = await CartItem.findByPk(cartItemId, {
    include: [
      {
        model: Cart,
        as: 'cart'
      },
      {
        model: Product,
        as: 'product'
      }
    ]
  });

  if (!cartItem) {
    return next(new AppError('Cart item not found', 404));
  }

  // Verify cart belongs to user
  if (cartItem.cart.userId !== userId) {
    return next(new AppError('Unauthorized access to this cart', 403));
  }

  // Check stock availability
  const product = cartItem.product;
  let availableStock = product.stock;

  if (cartItem.productVariantId) {
    const variant = await ProductVariant.findByPk(cartItem.productVariantId);
    if (!variant) {
      return next(new AppError('Variant no longer available', 404));
    }
    availableStock = variant.stock;
  }

  if (availableStock < quantity) {
    return next(
      new AppError(
        `Only ${availableStock} items available. Current stock: ${availableStock}`,
        400
      )
    );
  }

  // Update cart item
  const newTotalPrice = quantity * parseFloat(cartItem.price);
  await cartItem.update({
    quantity,
    totalPrice: newTotalPrice
  });

  // Update cart totals
  const cart = cartItem.cart;
  const cartItems = await CartItem.findAll({ where: { cartId: cart.id } });
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);

  await cart.update({ totalItems, totalPrice });

  const updatedCart = await Cart.findByPk(cart.id, {
    include: [
      {
        model: CartItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price', 'stock']
          },
          {
            model: ProductVariant,
            as: 'variant',
            attributes: ['id', 'name', 'sku', 'stock']
          }
        ]
      }
    ]
  });

  res.status(200).json({
    status: 'success',
    message: 'Cart item updated successfully',
    data: {
      cart: updatedCart
    }
  });
});

/**
 * Remove item from cart
 * DELETE /api/cart/remove/:cartItemId
 */
const removeFromCart = catchAsync(async (req, res, next) => {
  const { cartItemId } = req.params;
  const userId = req.user.id;

  const cartItem = await CartItem.findByPk(cartItemId, {
    include: [
      {
        model: Cart,
        as: 'cart'
      }
    ]
  });

  if (!cartItem) {
    return next(new AppError('Cart item not found', 404));
  }

  // Verify cart belongs to user
  if (cartItem.cart.userId !== userId) {
    return next(new AppError('Unauthorized access to this cart', 403));
  }

  const cart = cartItem.cart;

  // Remove item
  await cartItem.destroy();

  // Update cart totals
  const remainingItems = await CartItem.findAll({ where: { cartId: cart.id } });
  const totalItems = remainingItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = remainingItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);

  await cart.update({ totalItems, totalPrice });

  const updatedCart = await Cart.findByPk(cart.id, {
    include: [
      {
        model: CartItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price', 'stock']
          }
        ]
      }
    ]
  });

  res.status(200).json({
    status: 'success',
    message: 'Item removed from cart successfully',
    data: {
      cart: updatedCart
    }
  });
});

/**
 * Clear entire cart
 * DELETE /api/cart/clear
 */
const clearCart = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const cart = await Cart.findOne({ where: { userId, isActive: true } });

  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }

  // Delete all cart items
  await CartItem.destroy({ where: { cartId: cart.id } });

  // Reset cart
  await cart.update({ totalItems: 0, totalPrice: 0 });

  res.status(200).json({
    status: 'success',
    message: 'Cart cleared successfully',
    data: {
      cart
    }
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
