const express = require('express');
const { body, param, query } = require('express-validator');
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

// All order routes require authentication
router.use(protect);

// Validation middleware
const placeOrderValidation = [
  body('shippingAddressId')
    .trim()
    .notEmpty()
    .withMessage('Shipping address ID is required')
    .isUUID()
    .withMessage('Shipping address ID must be a valid UUID'),
  body('paymentMethod')
    .optional()
    .isIn(['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet', 'cod'])
    .withMessage('Invalid payment method'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

const updateOrderStatusValidation = [
  param('orderId')
    .isUUID()
    .withMessage('Order ID must be a valid UUID'),
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
    .withMessage('Invalid order status')
];

const updatePaymentStatusValidation = [
  param('orderId')
    .isUUID()
    .withMessage('Order ID must be a valid UUID'),
  body('paymentStatus')
    .trim()
    .notEmpty()
    .withMessage('Payment status is required')
    .isIn(['pending', 'completed', 'failed', 'refunded'])
    .withMessage('Invalid payment status'),
  body('paymentId')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Payment ID must not exceed 100 characters')
];

const cancelOrderValidation = [
  param('orderId')
    .isUUID()
    .withMessage('Order ID must be a valid UUID'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters')
];

const orderIdValidation = [
  param('orderId')
    .isUUID()
    .withMessage('Order ID must be a valid UUID')
];

const getOrdersValidation = [
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
    .withMessage('Invalid status filter'),
  query('paymentStatus')
    .optional()
    .isIn(['pending', 'completed', 'failed', 'refunded'])
    .withMessage('Invalid payment status filter'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be at least 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'finalAmount', 'status'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC')
];

// Routes
router.get('/', getOrdersValidation, validate, orderController.getOrders);
router.get('/analytics/summary', orderController.getOrderAnalytics);
router.get('/:orderId', orderIdValidation, validate, orderController.getOrder);

router.post('/place', placeOrderValidation, validate, orderController.placeOrder);

router.patch(
  '/:orderId/status',
  updateOrderStatusValidation,
  validate,
  orderController.updateOrderStatus
);
router.patch(
  '/:orderId/payment-status',
  updatePaymentStatusValidation,
  validate,
  orderController.updatePaymentStatus
);
router.post(
  '/:orderId/cancel',
  cancelOrderValidation,
  validate,
  orderController.cancelOrder
);

module.exports = router;
