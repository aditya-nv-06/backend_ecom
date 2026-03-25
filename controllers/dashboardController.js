const { Op, fn, col } = require('sequelize');
const { User, Product, Order, OrderItem, Cart, CartItem, ShippingAddress } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const parseRange = (value, fallback, min, max) => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  if (parsed < min || parsed > max) {
    return null;
  }

  return parsed;
};

const buildSalesTrend = (orders, days) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bucket = new Map();

  for (let i = 0; i < days; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    bucket.set(key, { date: key, revenue: 0, orders: 0 });
  }

  for (const order of orders) {
    const createdAt = new Date(order.createdAt);
    const key = createdAt.toISOString().slice(0, 10);

    if (!bucket.has(key)) {
      continue;
    }

    const current = bucket.get(key);
    current.revenue += Number.parseFloat(order.finalAmount || 0);
    current.orders += 1;
    bucket.set(key, current);
  }

  return Array.from(bucket.values()).sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * GET /api/dashboard/admin/overview
 * Admin dashboard summary
 */
const getAdminOverview = catchAsync(async (req, res, next) => {
  const days = parseRange(req.query.days, 30, 1, 365);

  if (days === null) {
    return next(new AppError('days must be between 1 and 365', 400));
  }

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - (days - 1));

  const revenueStatuses = ['confirmed', 'processing', 'shipped', 'delivered'];

  const [
    totalUsers,
    activeUsers,
    newUsers,
    totalProducts,
    activeProducts,
    outOfStockProducts,
    lowStockProducts,
    totalOrders,
    periodOrdersCount,
    cancelledOrders,
    deliveredOrders,
    grossRevenueRaw,
    periodRevenueRaw,
    orderStatusBreakdownRaw,
    paymentStatusBreakdownRaw,
    periodOrders
  ] = await Promise.all([
    User.count(),
    User.count({ where: { isActive: true } }),
    User.count({ where: { createdAt: { [Op.gte]: startDate } } }),
    Product.count(),
    Product.count({ where: { isActive: true } }),
    Product.count({ where: { isActive: true, stock: { [Op.lte]: 0 } } }),
    Product.count({ where: { isActive: true, stock: { [Op.gt]: 0, [Op.lte]: 5 } } }),
    Order.count(),
    Order.count({ where: { createdAt: { [Op.gte]: startDate } } }),
    Order.count({ where: { status: 'cancelled' } }),
    Order.count({ where: { status: 'delivered' } }),
    Order.sum('finalAmount', { where: { status: { [Op.in]: revenueStatuses } } }),
    Order.sum('finalAmount', {
      where: {
        status: { [Op.in]: revenueStatuses },
        createdAt: { [Op.gte]: startDate }
      }
    }),
    Order.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true
    }),
    Order.findAll({
      attributes: ['paymentStatus', [fn('COUNT', col('id')), 'count']],
      group: ['paymentStatus'],
      raw: true
    }),
    Order.findAll({
      where: {
        status: { [Op.in]: revenueStatuses },
        createdAt: { [Op.gte]: startDate }
      },
      attributes: ['createdAt', 'finalAmount'],
      raw: true
    })
  ]);

  const grossRevenue = Number.parseFloat(grossRevenueRaw || 0);
  const periodRevenue = Number.parseFloat(periodRevenueRaw || 0);

  const averageOrderValue = totalOrders > 0 ? grossRevenue / totalOrders : 0;
  const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
  const deliveryRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

  const orderStatusBreakdown = orderStatusBreakdownRaw.reduce((acc, item) => {
    acc[item.status] = Number.parseInt(item.count, 10);
    return acc;
  }, {});

  const paymentStatusBreakdown = paymentStatusBreakdownRaw.reduce((acc, item) => {
    acc[item.paymentStatus] = Number.parseInt(item.count, 10);
    return acc;
  }, {});

  const salesTrend = buildSalesTrend(periodOrders, days);

  res.status(200).json({
    status: 'success',
    data: {
      range: {
        days,
        startDate,
        endDate: new Date()
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        newInRange: newUsers
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        outOfStock: outOfStockProducts,
        lowStock: lowStockProducts
      },
      orders: {
        total: totalOrders,
        inRange: periodOrdersCount,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
        cancellationRate: Number(cancellationRate.toFixed(2)),
        deliveryRate: Number(deliveryRate.toFixed(2)),
        byStatus: orderStatusBreakdown,
        byPaymentStatus: paymentStatusBreakdown
      },
      revenue: {
        total: Number(grossRevenue.toFixed(2)),
        inRange: Number(periodRevenue.toFixed(2)),
        averageOrderValue: Number(averageOrderValue.toFixed(2))
      },
      salesTrend
    }
  });
});

/**
 * GET /api/dashboard/admin/top-products
 */
const getTopProducts = catchAsync(async (req, res, next) => {
  const limit = parseRange(req.query.limit, 10, 1, 50);

  if (limit === null) {
    return next(new AppError('limit must be between 1 and 50', 400));
  }

  const products = await Product.findAll({
    where: { isActive: true },
    attributes: ['id', 'name', 'price', 'stock', 'soldCount', 'rating', 'totalReviews'],
    order: [['soldCount', 'DESC'], ['rating', 'DESC'], ['createdAt', 'DESC']],
    limit
  });

  res.status(200).json({
    status: 'success',
    data: {
      count: products.length,
      products
    }
  });
});

/**
 * GET /api/dashboard/admin/recent-orders
 */
const getRecentOrders = catchAsync(async (req, res, next) => {
  const limit = parseRange(req.query.limit, 10, 1, 50);

  if (limit === null) {
    return next(new AppError('limit must be between 1 and 50', 400));
  }

  const orders = await Order.findAll({
    attributes: [
      'id',
      'orderNumber',
      'status',
      'paymentStatus',
      'finalAmount',
      'createdAt',
      [fn('COUNT', col('items.id')), 'itemCount']
    ],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      },
      {
        model: OrderItem,
        as: 'items',
        attributes: []
      }
    ],
    group: ['Order.id', 'user.id'],
    order: [['createdAt', 'DESC']],
    limit,
    subQuery: false
  });

  res.status(200).json({
    status: 'success',
    data: {
      count: orders.length,
      orders
    }
  });
});

/**
 * GET /api/dashboard/user/overview
 * Logged-in user's dashboard summary
 */
const getUserOverview = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const [
    orderCount,
    activeOrderCount,
    deliveredOrderCount,
    cancelledOrderCount,
    totalSpentRaw,
    cart,
    defaultAddress,
    recentOrders
  ] = await Promise.all([
    Order.count({ where: { userId } }),
    Order.count({ where: { userId, status: { [Op.in]: ['pending', 'confirmed', 'processing', 'shipped'] } } }),
    Order.count({ where: { userId, status: 'delivered' } }),
    Order.count({ where: { userId, status: 'cancelled' } }),
    Order.sum('finalAmount', { where: { userId, status: { [Op.ne]: 'cancelled' } } }),
    Cart.findOne({
      where: { userId, isActive: true },
      attributes: ['id', 'totalItems', 'totalPrice'],
      include: [
        {
          model: CartItem,
          as: 'items',
          attributes: ['id', 'productId', 'quantity', 'price', 'totalPrice']
        }
      ]
    }),
    ShippingAddress.findOne({
      where: { userId, isDefault: true },
      attributes: ['id', 'fullName', 'phoneNumber', 'addressLine1', 'city', 'state', 'postalCode', 'country']
    }),
    Order.findAll({
      where: { userId },
      attributes: ['id', 'orderNumber', 'status', 'paymentStatus', 'finalAmount', 'createdAt'],
      include: [
        {
          model: OrderItem,
          as: 'items',
          attributes: ['id', 'productName', 'quantity', 'totalPrice']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    })
  ]);

  const totalSpent = Number.parseFloat(totalSpentRaw || 0);

  res.status(200).json({
    status: 'success',
    data: {
      orders: {
        total: orderCount,
        active: activeOrderCount,
        delivered: deliveredOrderCount,
        cancelled: cancelledOrderCount
      },
      spending: {
        totalSpent: Number(totalSpent.toFixed(2)),
        averagePerOrder: orderCount > 0 ? Number((totalSpent / orderCount).toFixed(2)) : 0
      },
      cart: cart || { totalItems: 0, totalPrice: 0, items: [] },
      defaultShippingAddress: defaultAddress || null,
      recentOrders
    }
  });
});

module.exports = {
  getAdminOverview,
  getTopProducts,
  getRecentOrders,
  getUserOverview
};
