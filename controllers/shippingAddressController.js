const { ShippingAddress, User } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');

/**
 * =========================================================================
 *  ADDRESS DETAILS DIVISIONS:
 *  - SHIPPING DETAILS: Physical location (Address, City, State, ZIP)
 *  - DELIVERY DETAILS: Recipient & Service info (Name, Phone, Email, Type)
 * =========================================================================
 */


/**
 * Get all shipping addresses for user
 * GET /api/shipping-addresses
 */
const getShippingAddresses = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const addresses = await ShippingAddress.findAll({
    where: { userId },
    order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
  });

  res.status(200).json({
    status: 'success',
    data: {
      addresses,
      total: addresses.length
    }
  });
});

/**
 * Get single shipping address
 * GET /api/shipping-addresses/:addressId
 */
const getShippingAddress = catchAsync(async (req, res, next) => {
  const { addressId } = req.params;
  const userId = req.user.id;

  const address = await ShippingAddress.findByPk(addressId);

  if (!address) {
    return next(new AppError('Shipping address not found', 404));
  }

  // Verify address belongs to user
  if (address.userId !== userId) {
    return next(new AppError('Unauthorized access to this address', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      address
    }
  });
});

/**
 * Create new shipping address
 * POST /api/shipping-addresses
 */
const createShippingAddress = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const {
    /** DELIVERY DETAILS (Recipient & Contact) **/
    fullName,
    phoneNumber,
    email,

    /** SHIPPING DETAILS (Location Information) **/
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,

    /** PREFERENCES **/
    isDefault,
    addressType
  } = req.body;

  // Validation
  if (!fullName || !phoneNumber || !email || !addressLine1 || !city || !state || !postalCode) {
    return next(new AppError('All required fields must be provided', 400));
  }

  // Validate phone number format (basic validation)
  const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
  if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
    return next(new AppError('Invalid phone number format', 400));
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError('Invalid email format', 400));
  }

  // Validate postal code
  if (postalCode.length < 4 || postalCode.length > 10) {
    return next(new AppError('Postal code must be between 4 and 10 characters', 400));
  }

  // If setting as default, unset other default addresses
  if (isDefault) {
    await ShippingAddress.update(
      { isDefault: false },
      { where: { userId } }
    );
  }

  const address = await ShippingAddress.create({
    userId,
    // Delivery Details
    fullName,
    phoneNumber: phoneNumber.trim(),
    email: email.toLowerCase(),
    
    // Shipping Details
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode: postalCode.trim(),
    country: country || 'India',
    
    // Preferences
    isDefault: isDefault || false,
    addressType: addressType || 'home'
  });

  res.status(201).json({
    status: 'success',
    message: 'Shipping address created successfully',
    data: {
      address
    }
  });
});

/**
 * Update shipping address
 * PUT /api/shipping-addresses/:addressId
 */
const updateShippingAddress = catchAsync(async (req, res, next) => {
  const { addressId } = req.params;
  const userId = req.user.id;
  const updates = req.body;

  /** 
   * ADDRESS FIELD CATEGORIES IN UPDATES:
   * - Delivery Details: fullName, phoneNumber, email, addressType
   * - Shipping Details: addressLine1, addressLine2, city, state, postalCode, country
   * - Preferences: isDefault
   */

  // Remove userId from updates for security
  delete updates.userId;

  const address = await ShippingAddress.findByPk(addressId);

  if (!address) {
    return next(new AppError('Shipping address not found', 404));
  }

  // Verify address belongs to user
  if (address.userId !== userId) {
    return next(new AppError('Unauthorized access to this address', 403));
  }

  // Validate phone if provided
  if (updates.phoneNumber) {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
    if (!phoneRegex.test(updates.phoneNumber.replace(/\s/g, ''))) {
      return next(new AppError('Invalid phone number format', 400));
    }
  }

  // Validate email if provided
  if (updates.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(updates.email)) {
      return next(new AppError('Invalid email format', 400));
    }
    updates.email = updates.email.toLowerCase();
  }

  // Validate postal code if provided
  if (updates.postalCode) {
    if (updates.postalCode.length < 4 || updates.postalCode.length > 10) {
      return next(new AppError('Postal code must be between 4 and 10 characters', 400));
    }
  }

  // Handle setting as default
  if (updates.isDefault === true) {
    await ShippingAddress.update(
      { isDefault: false },
      { where: { userId, id: { [Op.ne]: addressId } } }
    );
  }

  await address.update(updates);

  res.status(200).json({
    status: 'success',
    message: 'Shipping address updated successfully',
    data: {
      address
    }
  });
});

/**
 * Set address as default
 * PATCH /api/shipping-addresses/:addressId/set-default
 */
const setDefaultAddress = catchAsync(async (req, res, next) => {
  const { addressId } = req.params;
  const userId = req.user.id;

  const address = await ShippingAddress.findByPk(addressId);

  if (!address) {
    return next(new AppError('Shipping address not found', 404));
  }

  // Verify address belongs to user
  if (address.userId !== userId) {
    return next(new AppError('Unauthorized access to this address', 403));
  }

  // Unset all other default addresses
  await ShippingAddress.update(
    { isDefault: false },
    { where: { userId, id: { [Op.ne]: addressId } } }
  );

  // Set this address as default
  await address.update({ isDefault: true });

  res.status(200).json({
    status: 'success',
    message: 'Address set as default successfully',
    data: {
      address
    }
  });
});

/**
 * Delete shipping address
 * DELETE /api/shipping-addresses/:addressId
 */
const deleteShippingAddress = catchAsync(async (req, res, next) => {
  const { addressId } = req.params;
  const userId = req.user.id;

  const address = await ShippingAddress.findByPk(addressId);

  if (!address) {
    return next(new AppError('Shipping address not found', 404));
  }

  // Verify address belongs to user
  if (address.userId !== userId) {
    return next(new AppError('Unauthorized access to this address', 403));
  }

  // Check if this address is used in any active orders
  const { Order } = require('../models');
  const activeOrder = await Order.findOne({
    where: {
      shippingAddressId: addressId,
      status: { [Op.in]: ['pending', 'confirmed', 'processing', 'shipped'] }
    }
  });

  if (activeOrder) {
    return next(
      new AppError(
        'Cannot delete address that is used in active orders',
        400
      )
    );
  }

  // If this was default address, set another as default
  if (address.isDefault) {
    const anotherAddress = await ShippingAddress.findOne({
      where: { userId, id: { [Op.ne]: addressId } }
    });

    if (anotherAddress) {
      await anotherAddress.update({ isDefault: true });
    }
  }

  await address.destroy();

  res.status(200).json({
    status: 'success',
    message: 'Shipping address deleted successfully'
  });
});

module.exports = {
  getShippingAddresses,
  getShippingAddress,
  createShippingAddress,
  updateShippingAddress,
  setDefaultAddress,
  deleteShippingAddress
};
