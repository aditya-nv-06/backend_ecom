# Order API Documentation

## Overview
The Order API allows users to place orders, track them, and manage their order history.

## Base URL
`/api/orders`

## Authentication
All endpoints require authentication. Include the JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Get All User Orders
**GET** `/api/orders`

Retrieve all orders for the authenticated user with filtering and pagination.

#### Query Parameters
- `status` (optional): Filter by order status - `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `returned`
- `paymentStatus` (optional): Filter by payment status - `pending`, `completed`, `failed`, `refunded`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `sortBy` (optional): Sort field - `createdAt`, `finalAmount`, `status` (default: `createdAt`)
- `sortOrder` (optional): Sort order - `ASC`, `DESC` (default: `DESC`)

#### Request
```bash
# Get all orders
curl -X GET http://localhost:5000/api/orders \
  -H "Authorization: Bearer <token>"

# Get delivered orders with pagination
curl -X GET "http://localhost:5000/api/orders?status=delivered&page=1&limit=10" \
  -H "Authorization: Bearer <token>"

# Get pending payment orders sorted by amount
curl -X GET "http://localhost:5000/api/orders?paymentStatus=pending&sortBy=finalAmount&sortOrder=DESC" \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "orders": [
      {
        "id": "uuid",
        "orderNumber": "ORD-1711270800000-234",
        "userId": "uuid",
        "shippingAddressId": "uuid",
        "totalPrice": 5999.00,
        "shippingCost": 50.00,
        "taxAmount": 300.00,
        "discountAmount": 0.00,
        "finalAmount": 6349.00,
        "status": "shipped",
        "paymentStatus": "completed",
        "paymentMethod": "cod",
        "paymentId": null,
        "notes": "Please deliver after 5 PM",
        "estimatedDeliveryDate": "2026-03-31T00:00:00Z",
        "cancelledAt": null,
        "cancelReason": null,
        "createdAt": "2026-03-24T10:00:00Z",
        "updatedAt": "2026-03-24T12:00:00Z",
        "items": [
          {
            "id": "uuid",
            "orderId": "uuid",
            "productId": "uuid",
            "productName": "Laptop",
            "quantity": 1,
            "priceAtPurchase": 59999.00,
            "totalPrice": 59999.00,
            "status": "shipped",
            "product": {
              "id": "uuid",
              "name": "Laptop",
              "price": 59999.00
            }
          }
        ],
        "shippingAddress": {
          "fullName": "John Doe",
          "email": "john@example.com",
          "phoneNumber": "9876543210",
          "addressLine1": "123 Main St",
          "city": "New York",
          "state": "NY",
          "postalCode": "10001"
        }
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "pages": 2
    }
  }
}
```

#### Error Responses
- **400**: Invalid query parameters
- **401**: Unauthorized

---

### 2. Get Single Order
**GET** `/api/orders/:orderId`

Retrieve details of a specific order.

#### Request Parameters
- `orderId` (UUID): The ID of the order

#### Request
```bash
curl -X GET http://localhost:5000/api/orders/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "order": {
      "id": "uuid",
      "orderNumber": "ORD-1711270800000-234",
      "userId": "uuid",
      "shippingAddressId": "uuid",
      "totalPrice": 5999.00,
      "shippingCost": 50.00,
      "taxAmount": 300.00,
      "discountAmount": 0.00,
      "finalAmount": 6349.00,
      "status": "shipped",
      "paymentStatus": "completed",
      "paymentMethod": "cod",
      "estimatedDeliveryDate": "2026-03-31T00:00:00Z",
      "items": [
        {
          "id": "uuid",
          "orderId": "uuid",
          "productId": "uuid",
          "productVariantId": null,
          "productName": "Laptop",
          "quantity": 1,
          "priceAtPurchase": 5999.00,
          "totalPrice": 5999.00,
          "status": "shipped",
          "product": {
            "id": "uuid",
            "name": "Laptop",
            "price": 5999.00,
            "stock": 5
          },
          "variant": null
        }
      ],
      "shippingAddress": {
        "id": "uuid",
        "fullName": "John Doe",
        "email": "john@example.com",
        "phoneNumber": "9876543210",
        "addressLine1": "123 Main St",
        "addressLine2": "Apt 4B",
        "city": "New York",
        "state": "NY",
        "postalCode": "10001",
        "country": "India"
      },
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2026-03-24T10:00:00Z",
      "updatedAt": "2026-03-24T12:00:00Z"
    }
  }
}
```

#### Error Responses
- **401**: Unauthorized
- **403**: Unauthorized access to this order
- **404**: Order not found

---

### 3. Place Order
**POST** `/api/orders/place`

Place a new order from the user's cart.

#### Request Body
```json
{
  "shippingAddressId": "uuid",
  "paymentMethod": "cod",
  "notes": "Please deliver after 5 PM"
}
```

#### Request
```bash
curl -X POST http://localhost:5000/api/orders/place \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddressId": "550e8400-e29b-41d4-a716-446655440000",
    "paymentMethod": "cod",
    "notes": "Please deliver after 5 PM"
  }'
```

#### Response (201 Created)
```json
{
  "status": "success",
  "message": "Order placed successfully",
  "data": {
    "order": {
      "id": "uuid",
      "orderNumber": "ORD-1711270800000-234",
      "userId": "uuid",
      "shippingAddressId": "uuid",
      "totalPrice": 5999.00,
      "shippingCost": 50.00,
      "taxAmount": 300.00,
      "discountAmount": 0.00,
      "finalAmount": 6349.00,
      "status": "pending",
      "paymentStatus": "pending",
      "paymentMethod": "cod",
      "notes": "Please deliver after 5 PM",
      "estimatedDeliveryDate": "2026-03-31T00:00:00Z",
      "items": [
        {
          "id": "uuid",
          "orderId": "uuid",
          "productId": "uuid",
          "productName": "Laptop",
          "quantity": 1,
          "priceAtPurchase": 5999.00,
          "totalPrice": 5999.00,
          "status": "pending"
        }
      ]
    }
  }
}
```

#### Error Responses
- **400**:
  - `Shipping address is required`
  - `Invalid payment method`
  - `Cart is empty. Cannot place order`
  - `Product "X" is no longer available`
  - `Variant for "X" is no longer available`
  - `Insufficient stock for "X". Available: Y, Requested: Z`
  - `Shipping address not found or invalid`
- **401**: Unauthorized
- **404**: Address or product not found

---

### 4. Update Order Status
**PATCH** `/api/orders/:orderId/status`

Update the status of an order (typically admin operation).

#### Request Parameters
- `orderId` (UUID): The ID of the order

#### Request Body
```json
{
  "status": "confirmed"
}
```

#### Valid Status Transitions
```
pending       → confirmed, cancelled
confirmed     → processing, cancelled
processing    → shipped, cancelled
shipped       → delivered, returned
delivered     → returned
cancelled     → (none)
returned      → (none)
```

#### Request
```bash
curl -X PATCH http://localhost:5000/api/orders/550e8400-e29b-41d4-a716-446655440000/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shipped"
  }'
```

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "Order status updated successfully",
  "data": {
    "order": {
      "id": "uuid",
      "status": "shipped",
      "updatedAt": "2026-03-24T14:30:00Z",
      ...
    }
  }
}
```

#### Error Responses
- **400**: `Cannot change order status from 'X' to 'Y'` or `Invalid order status`
- **401**: Unauthorized
- **404**: Order not found

---

### 5. Update Payment Status
**PATCH** `/api/orders/:orderId/payment-status`

Update the payment status of an order.

#### Request Parameters
- `orderId` (UUID): The ID of the order

#### Request Body
```json
{
  "paymentStatus": "completed",
  "paymentId": "razorpay_payment_123456"
}
```

#### Request
```bash
curl -X PATCH http://localhost:5000/api/orders/550e8400-e29b-41d4-a716-446655440000/payment-status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentStatus": "completed",
    "paymentId": "razorpay_payment_123456"
  }'
```

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "Payment status updated successfully",
  "data": {
    "order": {
      "id": "uuid",
      "paymentStatus": "completed",
      "paymentId": "razorpay_payment_123456",
      "status": "confirmed",
      ...
    }
  }
}
```

#### Error Responses
- **400**: Invalid payment status
- **401**: Unauthorized
- **404**: Order not found

---

### 6. Cancel Order
**POST** `/api/orders/:orderId/cancel`

Cancel an existing order and restore stock.

#### Request Parameters
- `orderId` (UUID): The ID of the order

#### Request Body
```json
{
  "reason": "Found better deal elsewhere"
}
```

#### Request
```bash
curl -X POST http://localhost:5000/api/orders/550e8400-e29b-41d4-a716-446655440000/cancel \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Found better deal elsewhere"
  }'
```

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "Order cancelled successfully",
  "data": {
    "order": {
      "id": "uuid",
      "status": "cancelled",
      "cancelledAt": "2026-03-24T15:00:00Z",
      "cancelReason": "Found better deal elsewhere",
      "paymentStatus": "refunded",
      ...
    }
  }
}
```

#### Error Responses
- **400**: `Cannot cancel order with status 'X'`
- **401**: Unauthorized
- **403**: Unauthorized access to this order
- **404**: Order not found

---

### 7. Get Order Analytics
**GET** `/api/orders/analytics/summary`

Get summary analytics for user's orders.

#### Request
```bash
curl -X GET http://localhost:5000/api/orders/analytics/summary \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "analytics": {
      "totalOrders": 15,
      "totalSpent": 95000.00,
      "cancelledOrders": 2,
      "averageOrderValue": 6333.33,
      "ordersByStatus": [
        {
          "status": "delivered",
          "count": 10
        },
        {
          "status": "shipped",
          "count": 2
        },
        {
          "status": "pending",
          "count": 1
        }
      ]
    }
  }
}
```

#### Error Responses
- **401**: Unauthorized

---

## Order Status Flow

```
┌─────────┐
│ pending │ ← Initial state after order placement
└────┬────┘
     │
     ├──→ confirmed ← Payment completed (or immediate for COD)
     │        │
     │        ├──→ processing ← Preparing for shipment
     │        │       │
     │        │       └──→ shipped ← Order dispatched
     │        │               │
     │        │               └──→ delivered ← Order delivered
     │        │                       │
     │        │                       └──→ returned (optional)
     │        │
     │        └──→ cancelled
     │
     └──→ cancelled
```

---

## Payment Status Flow

```
pending  → completed (after payment)
        → failed (payment failed)
        → refunded (after cancellation of paid order)
```

---

## Edge Cases Handled

### Stock Management
- ✓ Validates stock before order placement
- ✓ Checks stock for each item in cart
- ✓ Restores stock when order is cancelled
- ✓ Updates stock atomically during order placement
- ✓ Prevents overselling with transaction rollback

### Order Validation
- ✓ Cart must not be empty
- ✓ All products must still be active
- ✓ All variants must exist
- ✓ Shipping address must exist and belong to user
- ✓ Payment method must be valid

### Data Consistency
- ✓ Uses database transactions for order placement
- ✓ Atomically updates inventory, cart, and order
- ✓ Rolls back all changes on any error
- ✓ Prevents partial order placement
- ✓ Maintains referential integrity

### Status Management
- ✓ Validates status transitions
- ✓ Prevents invalid state changes
- ✓ Automatically handles refunds on cancellation
- ✓ Prevents cancellation of completed orders

### User Authorization
- ✓ Users can only access/modify their own orders
- ✓ Prevents cross-user order access
- ✓ Validates user ownership before operations

### Price Calculation
- ✓ Calculates taxes (5% default)
- ✓ Adds shipping costs ($50 default)
- ✓ Applies discounts if applicable
- ✓ Calculates final amount correctly
- ✓ Stores prices at time of purchase

### Shipping Address Protection
- ✓ Prevents deletion of addresses used in active orders
- ✓ Allows deletion of addresses in completed orders
- ✓ Restricts order creation to valid addresses

---

## Data Types

### Order Object
```json
{
  "id": "UUID",
  "orderNumber": "String",
  "userId": "UUID",
  "shippingAddressId": "UUID",
  "totalPrice": "Decimal(12,2)",
  "shippingCost": "Decimal(10,2)",
  "taxAmount": "Decimal(10,2)",
  "discountAmount": "Decimal(10,2)",
  "finalAmount": "Decimal(12,2)",
  "status": "Enum(pending, confirmed, processing, shipped, delivered, cancelled, returned)",
  "paymentStatus": "Enum(pending, completed, failed, refunded)",
  "paymentMethod": "Enum(credit_card, debit_card, upi, net_banking, wallet, cod)",
  "paymentId": "String (nullable)",
  "notes": "Text (nullable)",
  "estimatedDeliveryDate": "ISO 8601 DateTime (nullable)",
  "cancelledAt": "ISO 8601 DateTime (nullable)",
  "cancelReason": "Text (nullable)",
  "createdAt": "ISO 8601 DateTime",
  "updatedAt": "ISO 8601 DateTime"
}
```

### OrderItem Object
```json
{
  "id": "UUID",
  "orderId": "UUID",
  "productId": "UUID",
  "productVariantId": "UUID (nullable)",
  "productName": "String",
  "quantity": "Integer",
  "priceAtPurchase": "Decimal(10,2)",
  "totalPrice": "Decimal(12,2)",
  "status": "Enum(pending, dispatched, delivered, cancelled, returned)",
  "createdAt": "ISO 8601 DateTime",
  "updatedAt": "ISO 8601 DateTime"
}
```

---

## Examples

### Complete Order Flow
```bash
# 1. Add items to cart
curl -X POST http://localhost:5000/api/cart/add \
  -H "Authorization: Bearer <token>" \
  -d '{"productId": "prod-001", "quantity": 2}'

# 2. Create shipping address
curl -X POST http://localhost:5000/api/shipping-addresses \
  -H "Authorization: Bearer <token>" \
  -d '{
    "fullName": "John Doe",
    "phoneNumber": "9876543210",
    "email": "john@example.com",
    "addressLine1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "isDefault": true
  }'

# 3. Place order
curl -X POST http://localhost:5000/api/orders/place \
  -H "Authorization: Bearer <token>" \
  -d '{
    "shippingAddressId": "addr-uuid",
    "paymentMethod": "cod"
  }'

# 4. Track order
curl -X GET http://localhost:5000/api/orders/order-uuid \
  -H "Authorization: Bearer <token>"

# 5. Cancel order (if needed)
curl -X POST http://localhost:5000/api/orders/order-uuid/cancel \
  -H "Authorization: Bearer <token>" \
  -d '{"reason": "Changed my mind"}'
```
