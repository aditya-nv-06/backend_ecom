const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const productRoutes = require('./product/products.routes');
const adminProductRoutes = require('./product/adminProducts');
const productVariantRoutes = require('./productVariantRoute');
const specificationRoutes = require('./product/specifications.routes');
const wishlistRoutes = require('./wishlis_troutes');
const reviewRoutes = require('./Review');
const cartRoutes = require('./cartRoutes');
const shippingAddressRoutes = require('./shippingAddressRoutes');
const orderRoutes = require('./orderRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running'
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/admin/products', adminProductRoutes);
router.use('/product-variants', productVariantRoutes);
router.use('/specifications', specificationRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/reviews', reviewRoutes);
router.use('/cart', cartRoutes);
router.use('/shipping-addresses', shippingAddressRoutes);
router.use('/orders', orderRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
