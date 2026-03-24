const express = require('express');
const { body, param } = require('express-validator');
const shippingAddressController = require('../controllers/shippingAddressController');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

// All shipping address routes require authentication
router.use(protect);

// Validation middleware
const createAddressValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[\d\s\-\+\(\)]{10,15}$/)
    .withMessage('Phone number must be valid (10-15 characters)'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('addressLine1')
    .trim()
    .notEmpty()
    .withMessage('Address line 1 is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Address line 1 must be between 5 and 100 characters'),
  body('addressLine2')
    .trim()
    .optional()
    .isLength({ max: 100 })
    .withMessage('Address line 2 must not exceed 100 characters'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('state')
    .trim()
    .notEmpty()
    .withMessage('State is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  body('postalCode')
    .trim()
    .notEmpty()
    .withMessage('Postal code is required')
    .isLength({ min: 4, max: 10 })
    .withMessage('Postal code must be between 4 and 10 characters'),
  body('country')
    .trim()
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),
  body('addressType')
    .optional()
    .isIn(['home', 'office', 'other'])
    .withMessage('Address type must be one of: home, office, other')
];

const updateAddressValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phoneNumber')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]{10,15}$/)
    .withMessage('Phone number must be valid'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('state')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  body('postalCode')
    .optional()
    .trim()
    .isLength({ min: 4, max: 10 })
    .withMessage('Postal code must be between 4 and 10 characters'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),
  body('addressType')
    .optional()
    .isIn(['home', 'office', 'other'])
    .withMessage('Address type must be one of: home, office, other')
];

const addressIdValidation = [
  param('addressId')
    .isUUID()
    .withMessage('Address ID must be a valid UUID')
];

// Routes
router.get('/', shippingAddressController.getShippingAddresses);
router.get('/:addressId', addressIdValidation, validate, shippingAddressController.getShippingAddress);
router.post('/', createAddressValidation, validate, shippingAddressController.createShippingAddress);
router.put(
  '/:addressId',
  addressIdValidation,
  updateAddressValidation,
  validate,
  shippingAddressController.updateShippingAddress
);
router.patch(
  '/:addressId/set-default',
  addressIdValidation,
  validate,
  shippingAddressController.setDefaultAddress
);
router.delete('/:addressId', addressIdValidation, validate, shippingAddressController.deleteShippingAddress);

module.exports = router;
