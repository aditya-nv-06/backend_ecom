const express = require('express');
const { query } = require('express-validator');
const dashboardController = require('../controllers/dashboardController');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

const dayRangeValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('days must be between 1 and 365')
];

const limitValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('limit must be between 1 and 50')
];

router.use(protect);

// User dashboard
router.get('/user/overview', dashboardController.getUserOverview);

// Admin dashboard
router.get(
  '/admin/overview',
  restrictTo('admin'),
  dayRangeValidation,
  validate,
  dashboardController.getAdminOverview
);

router.get(
  '/admin/top-products',
  restrictTo('admin'),
  limitValidation,
  validate,
  dashboardController.getTopProducts
);

router.get(
  '/admin/recent-orders',
  restrictTo('admin'),
  limitValidation,
  validate,
  dashboardController.getRecentOrders
);

module.exports = router;
