const { Coupon, Cart, CartItem, Product, ProductVariant, CouponUsage, sequelize } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');

/**
 * Apply a coupon to the user's cart
 * POST /api/coupons/apply
 */
const applyCoupon = catchAsync(async (req, res, next) => {
  const { code } = req.body;
  const userId = req.user.id;

  if (!code) {
    return next(new AppError('Coupon code is required', 400));
  }

  // 1. Find coupon
  const coupon = await Coupon.findOne({
    where: {
      code: code.toUpperCase(),
      isActive: true,
      startDate: { [Op.lte]: new Date() },
      endDate: { [Op.gte]: new Date() }
    }
  });

  if (!coupon) {
    return next(new AppError('Invalid or expired coupon code', 404));
  }

  // 2. Check overall usage limit
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return next(new AppError('This coupon has reached its maximum usage limit', 400));
  }

  // 3. Check per-user usage limit
  const userUsageCount = await CouponUsage.count({
    where: { userId, couponId: coupon.id }
  });

  if (userUsageCount >= coupon.userUsageLimit) {
    return next(new AppError('You have already used this coupon maximum number of times', 400));
  }

  // 4. Get User's Cart
  const cart = await Cart.findOne({
    where: { userId, isActive: true }
  });

  if (!cart || cart.totalItems === 0) {
    return next(new AppError('Your cart is empty', 400));
  }

  // 5. Check minimum order amount
  if (parseFloat(cart.totalPrice) < parseFloat(coupon.minOrderAmount)) {
    return next(new AppError(`This coupon requires a minimum order amount of ${coupon.minOrderAmount}`, 400));
  }

  // 6. Link coupon to cart
  await cart.update({ couponId: coupon.id });

  res.status(200).json({
    status: 'success',
    message: 'Coupon applied successfully',
    data: {
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        maxDiscountAmount: coupon.maxDiscountAmount
      }
    }
  });
});

/**
 * Remove coupon from cart
 * DELETE /api/coupons/remove
 */
const removeCoupon = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const cart = await Cart.findOne({
    where: { userId, isActive: true }
  });

  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }

  await cart.update({ couponId: null });

  res.status(200).json({
    status: 'success',
    message: 'Coupon removed from cart'
  });
});

/**
 * Get available coupons for the user
 * GET /api/coupons
 */
const getAvailableCoupons = catchAsync(async (req, res, next) => {
  const coupons = await Coupon.findAll({
    where: {
      isActive: true,
      startDate: { [Op.lte]: new Date() },
      endDate: { [Op.gte]: new Date() }
    },
    attributes: ['code', 'type', 'value', 'minOrderAmount', 'maxDiscountAmount', 'endDate']
  });

  res.status(200).json({
    status: 'success',
    data: { coupons }
  });
});

/* ================= ADMIN CONTROLLERS ================= */

const createCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ status: 'success', data: { coupon } });
});

const getCoupons = catchAsync(async (req, res, next) => {
  const coupons = await Coupon.findAll();
  res.status(200).json({ status: 'success', data: { coupons } });
});

const updateCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findByPk(req.params.id);
  if (!coupon) return next(new AppError('Coupon not found', 404));
  await coupon.update(req.body);
  res.status(200).json({ status: 'success', data: { coupon } });
});

const deleteCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findByPk(req.params.id);
  if (!coupon) return next(new AppError('Coupon not found', 404));
  await coupon.destroy();
  res.status(204).json({ status: 'success', data: null });
});

module.exports = {
  applyCoupon,
  removeCoupon,
  getAvailableCoupons,
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon
};
