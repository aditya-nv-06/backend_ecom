# Payment API Documentation

## Overview
The Payment API handles integration with payment gateways (Razorpay) and provides utilities for testing payment flows in development.

## Base URL
`/api/payment`

---

## Endpoints

### 1. Initiate Payment
**POST** `/api/payment/initiate`

Creates a payment order with the gateway for an existing database order.

#### Request Body
```json
{
  "orderId": "uuid"
}
```

#### Response (200 OK - Mock Mode)
```json
{
  "status": "success",
  "message": "Mock payment initiated (development mode)",
  "data": {
    "orderId": "uuid",
    "amount": 5999.00,
    "currency": "INR",
    "paymentGateway": "mock"
  }
}
```

#### Response (200 OK - Production)
```json
{
  "status": "success",
  "message": "Payment initiated",
  "data": {
    "razorpayOrderId": "order_PJx...",
    "razorpayAmount": 599900,
    "razorpayKeyId": "rzp_test_..."
  }
}
```

---

### 2. Razorpay Webhook
**POST** `/api/payment/webhook`

Asynchronous endpoint called by Razorpay to update payment status. **This endpoint is public and uses HMAC signature verification.**

#### Headers Required
- `x-razorpay-signature`: HMAC-SHA256 signature

#### Handled Events
- `payment.captured`: Updates order to `confirmed` and payment to `completed`.
- `payment.failed`: Updates payment status to `failed`.

---

### 3. Mock Payment Success (Development Only)
**POST** `/api/payment/mock-success`

Directly completes a payment for testing purposes. Available in development environment.

#### Request Body
```json
{
  "orderId": "uuid"
}
```

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "Mock payment successful",
  "data": {
    "id": "uuid",
    "paymentStatus": "completed",
    "status": "confirmed"
  }
}
```

---

## Development Mode (Mock Mode)
If `RAZORPAY_KEY_ID` is missing or set to a placeholder (like `your_razorpay_key_id`), the system automatically enters **Mock Mode**. 
- Orders are placed without calling the real Razorpay API.
- Use the `/api/payment/mock-success` endpoint to simulate a successful payment after initiation.

## Webhook Security
Webhooks are secured using the `RAZORPAY_WEBHOOK_SECRET`. The server verifies the `x-razorpay-signature` against the raw request body to ensure the request originated from Razorpay.
