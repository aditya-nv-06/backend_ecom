const { Order, OrderItem, Cart, CartItem, ShippingAddress, Product, User, ProductVariant, Coupon, CouponUsage, sequelize } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');
const crypto = require('crypto');


/**
 * Get all orders for a user
 * GET /api/orders
 */
const getOrders = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { status, paymentStatus, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

  // Build where clause
  const where = { userId };
  if (status) {
    where.status = status;
  }
  if (paymentStatus) {
    where.paymentStatus = paymentStatus;
  }

  const offset = (page - 1) * limit;

  const { count, rows } = await Order.findAndCountAll({
    where,
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price']
          },
          {
            model: ProductVariant,
            as: 'variant',
            attributes: ['id', 'color', 'size']
          }
        ]
      },
      {
        model: ShippingAddress,
        as: 'shippingAddress',
        attributes: ['fullName', 'email', 'phoneNumber', 'addressLine1', 'city', 'state', 'postalCode']
      }
    ],
    order: [[sortBy, sortOrder]],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.status(200).json({
    status: 'success',
    data: {
      orders: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

/**
 * Get a single order
 * GET /api/orders/:id
 */
const getOrder = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: OrderItem,
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
            attributes: ['id', 'color', 'size']
          }
        ]
      },
      {
        model: ShippingAddress,
        as: 'shippingAddress'
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }
    ]
  });

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Verify order belongs to user
  if (order.userId !== userId) {
    return next(new AppError('Unauthorized access to this order', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      order
    }
  });
});

/**
 * Create a new order
 * POST /api/orders
 */
const placeOrder = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { shippingAddressId, paymentMethod = 'cod', notes } = req.body;

  // Validation
  if (!shippingAddressId) {
    return next(new AppError('Shipping address is required', 400));
  }

  if (!['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet', 'cod'].includes(paymentMethod)) {
    return next(new AppError('Invalid payment method', 400));
  }

  // Get user's cart
  const cart = await Cart.findOne({
    where: { userId, isActive: true },
    include: [
      {
        model: CartItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product'
          },
          {
            model: ProductVariant,
            as: 'variant'
          }
        ]
      },
      {
        model: Coupon,
        as: 'appliedCoupon'
      }
    ]
  });

  // Check if cart exists and has items
  if (!cart || cart.items.length === 0) {
    return next(new AppError('Cart is empty. Cannot place order', 400));
  }

  // Verify shipping address exists and belongs to user
  const shippingAddress = await ShippingAddress.findByPk(shippingAddressId);
  if (!shippingAddress || shippingAddress.userId !== userId) {
    return next(new AppError('Shipping address not found or invalid', 404));
  }

  // Transaction to ensure data consistency
  const transaction = await sequelize.transaction();

  try {
    // Verify stock availability and collect order items data
    const orderItemsData = [];
    for (const cartItem of cart.items) {
      const product = cartItem.product;

      // Check if product is still active
      if (!product.isActive) {
        await transaction.rollback();
        return next(new AppError(`Product "${product.name}" is no longer available`, 400));
      }

      // Check stock availability
      let currentStock = product.stock;
      if (cartItem.productVariantId) {
        const variant = cartItem.variant;
        if (!variant) {
          await transaction.rollback();
          return next(new AppError(`Variant for "${product.name}" is no longer available`, 400));
        }
        currentStock = variant.stock;
      }

      if (currentStock < cartItem.quantity) {
        await transaction.rollback();
        return next(
          new AppError(
            `Insufficient stock for "${product.name}". Available: ${currentStock}, Requested: ${cartItem.quantity}`,
            400
          )
        );
      }

      orderItemsData.push({
        productId: product.id,
        productVariantId: cartItem.productVariantId,
        productName: product.name,
        quantity: cartItem.quantity,
        priceAtPurchase: parseFloat(cartItem.price),
        totalPrice: parseFloat(cartItem.totalPrice)
      });
    }

    // Calculate order totals
    const subtotal = parseFloat(cart.totalPrice);
    const shippingCost = 50; // Fixed shipping cost
    const taxAmount = Math.round((subtotal * 5) / 100); // 5% tax
    
    // Calculate coupon discount
    let couponDiscount = 0;
    if (cart.appliedCoupon) {
      const coupon = cart.appliedCoupon;
      if (coupon.type === 'percentage') {
        couponDiscount = (subtotal * parseFloat(coupon.value)) / 100;
        if (coupon.maxDiscountAmount && couponDiscount > parseFloat(coupon.maxDiscountAmount)) {
          couponDiscount = parseFloat(coupon.maxDiscountAmount);
        }
      } else if (coupon.type === 'fixed') {
        couponDiscount = parseFloat(coupon.value);
      }
      couponDiscount = Math.min(couponDiscount, subtotal);
    }

    const finalAmount = subtotal + shippingCost + taxAmount - couponDiscount;

    // Generate order number (unique)
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create order
    const order = await Order.create(
      {
        orderNumber,
        userId,
        shippingAddressId,
        totalPrice: subtotal,
        shippingCost,
        taxAmount,
        discountAmount: couponDiscount,
        finalAmount,
        status: 'pending',
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
        paymentMethod,
        notes,
        couponId: cart.appliedCoupon ? cart.appliedCoupon.id : null,
        estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      { transaction }
    );

    // Create order items
    await OrderItem.bulkCreate(
      orderItemsData.map(item => ({
        ...item,
        orderId: order.id
      })),
      { transaction }
    );

    // Update product stock
    for (const cartItem of cart.items) {
      const product = cartItem.product;
      const newStock = product.stock - cartItem.quantity;

      await product.update(
        {
          stock: newStock,
          soldCount: product.soldCount + cartItem.quantity
        },
        { transaction }
      );

      // Update variant stock if applicable
      if (cartItem.productVariantId) {
        const variant = cartItem.variant;
        await variant.update(
          { stock: variant.stock - cartItem.quantity },
          { transaction }
        );
      }
    }

    // Clear cart
    await CartItem.destroy({ where: { cartId: cart.id }, transaction });
    await cart.update(
      { totalItems: 0, totalPrice: 0, couponId: null },
      { transaction }
    );

    // Record coupon usage
    if (cart.appliedCoupon) {
      await CouponUsage.create({
        userId,
        couponId: cart.appliedCoupon.id,
        orderId: order.id,
        discountAmount: couponDiscount,
        usedAt: new Date()
      }, { transaction });

      await cart.appliedCoupon.increment('usedCount', { by: 1, transaction });
    }

    // Commit transaction
    await transaction.commit();

    // Fetch complete order
    const createdOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name']
            },
            {
              model: ProductVariant,
              as: 'variant',
              attributes: ['id', 'color', 'size']
            }
          ]
        },
        {
          model: ShippingAddress,
          as: 'shippingAddress'
        }
      ]
    });

    res.status(201).json({
      status: 'success',
      message: 'Order placed successfully',
      data: {
        order: createdOrder
      }
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

/**
 * Update an order
 * PATCH /api/orders/:id
 */
const updateOrderStatus = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const { status } = req.body;

  // Validate status
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid order status', 400));
  }

  const order = await Order.findByPk(orderId);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Check if status update is valid
  const statusTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'returned'],
    delivered: ['returned'],
    cancelled: [],
    returned: []
  };

  if (!statusTransitions[order.status].includes(status)) {
    return next(
      new AppError(
        `Cannot change order status from '${order.status}' to '${status}'`,
        400
      )
    );
  }

  const updates = { status };

  // Handle cancellation
  if (status === 'cancelled') {
    updates.cancelledAt = new Date();
    updates.paymentStatus = order.paymentStatus === 'completed' ? 'refunded' : 'failed';
  }

  await order.update(updates);

  const updatedOrder = await Order.findByPk(orderId, {
    include: [
      {
        model: OrderItem,
        as: 'items'
      },
      {
        model: ShippingAddress,
        as: 'shippingAddress'
      }
    ]
  });

  res.status(200).json({
    status: 'success',
    message: 'Order status updated successfully',
    data: {
      order: updatedOrder
    }
  });
});

/**
 * Update payment status
 * PATCH /api/orders/:id/payment-status
 */
const updatePaymentStatus = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const { paymentStatus, paymentId } = req.body;

  // Validate payment status
  const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
  if (!validStatuses.includes(paymentStatus)) {
    return next(new AppError('Invalid payment status', 400));
  }

  const order = await Order.findByPk(orderId);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  const updates = { paymentStatus };
  if (paymentId) {
    updates.paymentId = paymentId;
  }

  // If payment is completed, update order status to confirmed
  if (paymentStatus === 'completed' && order.status === 'pending') {
    updates.status = 'confirmed';
  }

  await order.update(updates);

  const updatedOrder = await Order.findByPk(orderId, {
    include: [
      {
        model: OrderItem,
        as: 'items'
      }
    ]
  });

  res.status(200).json({
    status: 'success',
    message: 'Payment status updated successfully',
    data: {
      order: updatedOrder
    }
  });
});

/**
 * Cancel an order
 * POST /api/orders/:id/cancel
 */
const cancelOrder = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const userId = req.user.id;
  const { reason } = req.body;

  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product'
          },
          {
            model: ProductVariant,
            as: 'variant'
          }
        ]
      }
    ]
  });

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Verify order belongs to user
  if (order.userId !== userId) {
    return next(new AppError('Unauthorized access to this order', 403));
  }

  // Check if order can be cancelled
  if (!['pending', 'confirmed', 'processing'].includes(order.status)) {
    return next(
      new AppError(
        `Cannot cancel order with status '${order.status}'`,
        400
      )
    );
  }

  const transaction = await sequelize.transaction();

  try {
    // Restore stock
    for (const orderItem of order.items) {
      const product = orderItem.product;
      const restoredStock = product.stock + orderItem.quantity;

      await product.update(
        {
          stock: restoredStock,
          soldCount: Math.max(0, product.soldCount - orderItem.quantity)
        },
        { transaction }
      );

      // Restore variant stock
      if (orderItem.productVariantId && orderItem.variant) {
        await orderItem.variant.update(
          { stock: orderItem.variant.stock + orderItem.quantity },
          { transaction }
        );
      }
    }

    // Update order
    await order.update(
      {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: reason || 'User cancelled',
        paymentStatus: order.paymentStatus === 'completed' ? 'refunded' : order.paymentStatus
      },
      { transaction }
    );

    await transaction.commit();

    const cancelledOrder = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: 'items'
        }
      ]
    });

    res.status(200).json({
      status: 'success',
      message: 'Order cancelled successfully',
      data: {
        order: cancelledOrder
      }
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

/**
 * Get order analytics for user
 * GET /api/orders/analytics/summary
 */
const getOrderAnalytics = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const totalOrders = await Order.count({ where: { userId } });
  const totalSpent = await Order.sum('finalAmount', { where: { userId } }) || 0;
  const cancelledOrders = await Order.count({
    where: { userId, status: 'cancelled' }
  });

  const ordersByStatus = await Order.findAll({
    where: { userId },
    attributes: [
      'status',
      [fn('count', col('id')), 'count']
    ],
    group: ['status'],
    raw: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      analytics: {
        totalOrders,
        totalSpent,
        cancelledOrders,
        averageOrderValue: totalOrders > 0 ? (totalSpent / totalOrders).toFixed(2) : 0,
        ordersByStatus
      }
    }
  });
});

/**
 * Get all orders for a user
 * GET /api/orders
 */

/**
 * Get a single order
 * GET /api/orders/:id
 */

/**
 * Create a new order
 * POST /api/orders
 */

/**
 * Update an order
 * PATCH /api/orders/:id
 */

/**
 * Delete an order
 * DELETE /api/orders/:id
 */

/**
 * Buy Now (Bypass Cart)
 * POST /api/orders/buy-now
 */
const buyNow = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { productId, productVariantId, quantity, shippingAddressId, paymentMethod = 'cod', notes } = req.body;

  // Validation
  if (!productId || !quantity || !shippingAddressId) {
    return next(new AppError('Product ID, quantity, and shipping address are required', 400));
  }

  if (!['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet', 'cod'].includes(paymentMethod)) {
    return next(new AppError('Invalid payment method', 400));
  }

  // Verify shipping address
  const shippingAddress = await ShippingAddress.findByPk(shippingAddressId);
  if (!shippingAddress || shippingAddress.userId !== userId) {
    return next(new AppError('Shipping address not found or invalid', 404));
  }

  // Transaction to ensure data consistency
  const transaction = await sequelize.transaction();

  try {
    // Fetch product
    const product = await Product.findByPk(productId, { transaction });
    if (!product || !product.isActive) {
      await transaction.rollback();
      return next(new AppError('Product is no longer available', 400));
    }

    // Check stock availability
    let currentStock = product.stock;
    let variant = null;

    if (productVariantId) {
      variant = await ProductVariant.findByPk(productVariantId, { transaction });
      if (!variant) {
        await transaction.rollback();
        return next(new AppError('Selected variant is not available', 400));
      }
      currentStock = variant.stock;
    }

    if (currentStock < quantity) {
      await transaction.rollback();
      return next(new AppError(`Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`, 400));
    }

    // Determine price using variant price or base price
    const unitPrice = variant ? parseFloat(variant.price) : parseFloat(product.price);
    const subtotal = unitPrice * quantity;
    const shippingCost = 50; // Fixed shipping for now
    const taxAmount = Math.round((subtotal * 5) / 100); // 5% tax
    const discountAmount = 0;
    const finalAmount = subtotal + shippingCost + taxAmount - discountAmount;

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create Order
    const order = await Order.create(
      {
        orderNumber,
        userId,
        shippingAddressId,
        totalPrice: subtotal,
        shippingCost,
        taxAmount,
        discountAmount,
        finalAmount,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod,
        notes,
        estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      { transaction }
    );

    // Create Order Item
    await OrderItem.create(
      {
        orderId: order.id,
        productId: product.id,
        productVariantId: productVariantId || null,
        productName: product.name,
        quantity,
        priceAtPurchase: unitPrice,
        totalPrice: subtotal
      },
      { transaction }
    );

    // Update Stock
    await product.update(
      {
        stock: product.stock - quantity,
        soldCount: product.soldCount + quantity
      },
      { transaction }
    );

    if (variant) {
      await variant.update(
        { stock: variant.stock - quantity },
        { transaction }
      );
    }

    await transaction.commit();

    // Fetch complete order
    const createdOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['id', 'name'] },
            { model: ProductVariant, as: 'variant', attributes: ['id', 'color', 'size'] }
          ]
        },
        { model: ShippingAddress, as: 'shippingAddress' }
      ]
    });

    res.status(201).json({
      status: 'success',
      message: 'Order placed successfully',
      data: {
        order: createdOrder
      }
    });

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

// Removed verifyPayment

module.exports = {
  getOrders,
  getOrder,
  placeOrder,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  getOrderAnalytics,
  buyNow
};
