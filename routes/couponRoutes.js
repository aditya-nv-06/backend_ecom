const express = require('express');
const { body } = require('express-validator');
const couponController = require('../controllers/couponController');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Publicly available (to authenticated users)
router.get('/', couponController.getAvailableCoupons);

const applyCouponValidation = [
  body('code').notEmpty().withMessage('Coupon code is required').trim().toUpperCase()
];

router.post('/apply', applyCouponValidation, validate, couponController.applyCoupon);
router.delete('/remove', couponController.removeCoupon);

/* ================= ADMIN ROUTES ================= */
router.use(restrictTo('admin'));

const couponValidation = [
  body('code').notEmpty().withMessage('Code is required').trim().toUpperCase(),
  body('type').isIn(['percentage', 'fixed']).withMessage('Invalid coupon type'),
  body('value').isFloat({ min: 0 }).withMessage('Value must be a positive number'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required')
];

router.route('/admin')
  .get(couponController.getCoupons)
  .post(couponValidation, validate, couponController.createCoupon);

router.route('/admin/:id')
  .patch(couponValidation, validate, couponController.updateCoupon)
  .delete(couponController.deleteCoupon);

module.exports = router;
