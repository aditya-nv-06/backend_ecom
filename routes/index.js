const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const productRoutes = require('./product/products.routes');
const adminProductRoutes = require('./product/adminProducts');
const productVariantRoutes = require('./productVariantRoute');
const specificationRoutes = require("./product/specifications.routes");
const reviewRoutes = require('./Review');
const QuestionsRoutes = require('./qa.routes');
const OrderRoutes = require('./orderRoutes');
const ShippingRoutes = require('./shippingAddressRoutes');
const CartRoutes=require("./cartRoutes")
const CategorieRoutes=require("./categorieRoutes")

const router = express.Router();
const wishlistRoutes = require("./wishlis_troutes");

router.use('/wishlist', wishlistRoutes);


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

router.use('/reviews', reviewRoutes);
router.use('/qa', QuestionsRoutes);
router.use('/orders', OrderRoutes);
router.use('/shipping', ShippingRoutes);
router.use('/cart',CartRoutes)
router.use('/categories',CategorieRoutes)

const paymentRoutes = require('./paymentRoutes');
const couponRoutes = require('./couponRoutes');

router.use('/payment', paymentRoutes);
router.use('/coupons', couponRoutes);

module.exports = router;
