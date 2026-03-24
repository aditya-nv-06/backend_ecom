const express = require('express');
const { body, param, validationResult } = require('express-validator');
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

// All cart routes require authentication
router.use(protect);

// Validation middleware
const addToCartValidation = [
  body('productId')
    .trim()
    .notEmpty()
    .withMessage('Product ID is required')
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('productVariantId')
    .optional()
    .isUUID()
    .withMessage('Product variant ID must be a valid UUID')
];

const updateCartItemValidation = [
  param('cartItemId')
    .isUUID()
    .withMessage('Cart item ID must be a valid UUID'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1')
];

const cartItemIdValidation = [
  param('cartItemId')
    .isUUID()
    .withMessage('Cart item ID must be a valid UUID')
];

// Routes
router.get('/', cartController.getCart);
router.post('/add', addToCartValidation, validate, cartController.addToCart);
router.put(
  '/update/:cartItemId',
  updateCartItemValidation,
  validate,
  cartController.updateCartItem
);
router.delete(
  '/remove/:cartItemId',
  cartItemIdValidation,
  validate,
  cartController.removeFromCart
);
router.delete('/clear', cartController.clearCart);

module.exports = router;
