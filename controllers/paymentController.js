const { Order, OrderItem, Product, User, sequelize } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const crypto = require('crypto');
const Razorpay = require('razorpay');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});

/**
 * Verify Razorpay payment
 * POST /api/payment/verify
 */
const verifyPayment = catchAsync(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
    return next(new AppError('Missing payment verification details', 400));
  }

  const order = await Order.findByPk(orderId);
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Create expected signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret')
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    // Payment is successful
    await order.update({
      paymentStatus: 'completed',
      status: 'confirmed',
      paymentId: razorpay_payment_id
    });

    return res.status(200).json({
      status: 'success',
      message: 'Payment verified successfully'
    });
  } else {
    // Payment verification failed
    await order.update({
      paymentStatus: 'failed'
    });

    return res.status(400).json({
      status: 'fail',
      message: 'Invalid payment signature'
    });
  }
});

/**
 * Retry Payment (Create new Razorpay Order for existing DB Order)
 * POST /api/payment/retry
 */
const retryPayment = catchAsync(async (req, res, next) => {
  const { orderId } = req.body;
  const userId = req.user.id;

  if (!orderId) {
    return next(new AppError('Order ID is required', 400));
  }

  const order = await Order.findByPk(orderId);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Verify order belongs to user
  if (order.userId !== userId) {
    return next(new AppError('Unauthorized access to this order', 403));
  }

  if (order.status !== 'pending' && order.status !== 'confirmed') {
    return next(new AppError(`Cannot retry payment for order with status: ${order.status}`, 400));
  }

  if (order.paymentStatus === 'completed') {
    return next(new AppError('Payment is already completed for this order', 400));
  }

  if (order.paymentMethod === 'cod') {
    return next(new AppError('Cash on delivery orders do not require online payment', 400));
  }

  try {
    const options = {
      amount: Math.round(order.finalAmount * 100), // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: order.id.toString(),
    };
    const rzpOrder = await razorpay.orders.create(options);
    
    // Update order with new razorpay order id
    await order.update({ paymentId: rzpOrder.id });

    return res.status(200).json({
      status: 'success',
      message: 'Payment retry initiated',
      data: {
        razorpayOrderId: rzpOrder.id,
        razorpayAmount: rzpOrder.amount,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (err) {
    console.error("Razorpay Order Recreation Error:", err);
    return next(new AppError('Payment gateway error. Please try again.', 500));
  }
});

/**
 * Initiate payment (Create Razorpay Order for an existing DB Order)
 * POST /api/payment/initiate
 */
const initiatePayment = catchAsync(async (req, res, next) => {
  const { orderId } = req.body;
  const userId = req.user.id;

  if (!orderId) {
    return next(new AppError('Order ID is required', 400));
  }

  const order = await Order.findByPk(orderId);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Verify order belongs to user
  if (order.userId !== userId) {
    return next(new AppError('Unauthorized access to this order', 403));
  }

  if (order.paymentStatus === 'completed') {
    return next(new AppError('Payment is already completed for this order', 400));
  }

  if (order.paymentMethod === 'cod') {
    return next(new AppError('Cash on delivery orders do not require online payment', 400));
  }

  try {
    // MOCK MODE (no Razorpay keys)
     if (!process.env.RAZORPAY_KEY_ID || 
         process.env.RAZORPAY_KEY_ID === "dummy_key_id" || 
         process.env.RAZORPAY_KEY_ID === "your_razorpay_key_id") {
    return res.status(200).json({
      status: "success",
      message: "Mock payment initiated (development mode)",
      data: {
        orderId: order.id,
        amount: order.finalAmount,
        currency: "INR",
        paymentGateway: "mock"
      }
    });
  }
  
  // REAL RAZORPAY
    const options = {
      amount: Math.round(order.finalAmount * 100), // amount in paise
      currency: "INR",
      receipt: order.id.toString(),
    };
    const rzpOrder = await razorpay.orders.create(options);
    
    // Update order with razorpay order id
    await order.update({ paymentId: rzpOrder.id });

    return res.status(200).json({
      status: 'success',
      message: 'Payment initiated',
      data: {
        razorpayOrderId: rzpOrder.id,
        razorpayAmount: rzpOrder.amount,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (err) {
    console.error("Razorpay Order Initiation Error Details:", err);
    
    const errObj = typeof err === 'object' ? err : { message: String(err) };
    
    const message = process.env.NODE_ENV === 'development' 
      ? `Payment gateway error: ${errObj.message || errObj.description || 'Unknown error'}` 
      : 'Payment gateway error. Please try again.';
      
    return next(new AppError(message, 500));
  }
});

/**
 * Razorpay Webhook
 * POST /api/payment/webhook
 */
const handleWebhook = catchAsync(async (req, res, next) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret';
  
  // Razorpay sends signature in 'x-razorpay-signature' header
  const signature = req.headers['x-razorpay-signature'];
  
  if (!signature || !req.rawBody) {
    return res.status(400).json({ status: 'fail', message: 'Missing signature or raw body' });
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(req.rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(400).json({ status: 'fail', message: 'Invalid signature' });
  }
  
  // For now, let's assume valid for development if signature exists or handle simply
  const event = req.body;

  console.log('Razorpay Webhook Event:', event.event);

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const razorpayOrderId = payment.order_id;
    
    const order = await Order.findOne({ where: { paymentId: razorpayOrderId } });
    
    if (order && order.paymentStatus !== 'completed') {
      await order.update({
        paymentStatus: 'completed',
        status: 'confirmed',
        paymentId: payment.id // Store the actual payment ID now
      });
      console.log(`Order ${order.id} marked as completed via webhook`);
    }
  } else if (event.event === 'payment.failed') {
    const payment = event.payload.payment.entity;
    const razorpayOrderId = payment.order_id;
    
    const order = await Order.findOne({ where: { paymentId: razorpayOrderId } });
    if (order) {
      await order.update({ paymentStatus: 'failed' });
      console.log(`Order ${order.id} marked as failed via webhook`);
    }
  }

  res.status(200).json({ status: 'ok' });
});

/**
 * Mock Payment Success (For Testing)
 * POST /api/payment/mock-success
 */
const mockPaymentSuccess = catchAsync(async (req, res, next) => {
  const { orderId } = req.body;

  const order = await Order.findByPk(orderId);

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  await order.update({
    paymentStatus: "completed",
    status: "confirmed",
    paymentId: "mock_payment_" + Date.now()
  });

  res.json({
    status: "success",
    message: "Mock payment successful",
    data: order
  });
});

module.exports = {
  verifyPayment,
  retryPayment,
  initiatePayment,
  handleWebhook,
  mockPaymentSuccess
};
