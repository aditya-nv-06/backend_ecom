const express = require('express');
const { body } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

// Webhook route (No authentication required, verification via signature)
router.post('/webhook', paymentController.handleWebhook);

// All other payment routes require authentication
router.use(protect);

// Validation middleware
const verifyPaymentValidation = [
  body('razorpay_order_id').notEmpty().withMessage('Razorpay order ID is required'),
  body('razorpay_payment_id').notEmpty().withMessage('Razorpay payment ID is required'),
  body('razorpay_signature').notEmpty().withMessage('Razorpay signature is required'),
  body('orderId').notEmpty().isUUID().withMessage('Valid order ID is required')
];

const initiatePaymentValidation = [
  body('orderId').notEmpty().isUUID().withMessage('Valid order ID is required')
];

// Routes
router.post('/initiate', initiatePaymentValidation, validate, paymentController.initiatePayment);
router.post('/verify', verifyPaymentValidation, validate, paymentController.verifyPayment);
router.post('/retry', initiatePaymentValidation, validate, paymentController.retryPayment);
router.post('/mock-success', initiatePaymentValidation, validate, paymentController.mockPaymentSuccess);

module.exports = router;
