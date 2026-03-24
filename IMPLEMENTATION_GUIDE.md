# E-Commerce Backend - Cart, Shipping & Orders Implementation Guide

## Overview
This document provides a complete implementation guide for the new cart, shipping address, and order management features added to the e-commerce backend.

## Table of Contents
1. [Features Implemented](#features-implemented)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Error Handling & Edge Cases](#error-handling--edge-cases)
5. [Setup Instructions](#setup-instructions)
6. [Testing Guide](#testing-guide)
7. [Architecture & Design Patterns](#architecture--design-patterns)

---

## Features Implemented

### 1. Shopping Cart
- ✅ Get user's cart
- ✅ Add items to cart
- ✅ Update item quantities
- ✅ Remove items from cart
- ✅ Clear entire cart
- ✅ Real-time cart totals calculation
- ✅ Stock validation before adding items
- ✅ Duplicate item detection and quantity aggregation

### 2. Shipping Addresses
- ✅ Create shipping addresses
- ✅ View all shipping addresses
- ✅ View single address
- ✅ Update shipping address
- ✅ Set default address
- ✅ Delete shipping address
- ✅ Comprehensive validation
- ✅ Default address auto-management
- ✅ Active order protection (prevent deletion)

### 3. Orders
- ✅ Place orders from cart
- ✅ Get all orders with filtering & pagination
- ✅ Get single order details
- ✅ Update order status
- ✅ Update payment status
- ✅ Cancel orders with stock restoration
- ✅ Get order analytics
- ✅ Automatic cart clearing after order
- ✅ Transaction-based order placement

---

## Database Schema

### Tables Created

#### 1. `carts`
```sql
CREATE TABLE carts (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL FOREIGN KEY,
  totalPrice DECIMAL(12,2),
  totalItems INTEGER,
  isActive BOOLEAN,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

#### 2. `cart_items`
```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY,
  cartId UUID NOT NULL FOREIGN KEY,
  productId UUID NOT NULL FOREIGN KEY,
  productVariantId UUID FOREIGN KEY (nullable),
  quantity INTEGER,
  price DECIMAL(10,2),
  totalPrice DECIMAL(12,2),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

#### 3. `shipping_addresses`
```sql
CREATE TABLE shipping_addresses (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL FOREIGN KEY,
  fullName VARCHAR(100),
  phoneNumber VARCHAR(15),
  email VARCHAR(255),
  addressLine1 VARCHAR(255),
  addressLine2 VARCHAR(255) (nullable),
  city VARCHAR(50),
  state VARCHAR(50),
  postalCode VARCHAR(10),
  country VARCHAR(50),
  isDefault BOOLEAN,
  addressType ENUM('home', 'office', 'other'),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

#### 4. `orders`
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  orderNumber VARCHAR(255) UNIQUE,
  userId UUID NOT NULL FOREIGN KEY,
  shippingAddressId UUID NOT NULL FOREIGN KEY,
  totalPrice DECIMAL(12,2),
  shippingCost DECIMAL(10,2),
  taxAmount DECIMAL(10,2),
  discountAmount DECIMAL(10,2),
  finalAmount DECIMAL(12,2),
  status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'),
  paymentStatus ENUM('pending', 'completed', 'failed', 'refunded'),
  paymentMethod ENUM('credit_card', 'debit_card', 'upi', 'net_banking', 'wallet', 'cod'),
  paymentId VARCHAR(255) (nullable),
  notes TEXT (nullable),
  estimatedDeliveryDate TIMESTAMP (nullable),
  cancelledAt TIMESTAMP (nullable),
  cancelReason TEXT (nullable),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

#### 5. `order_items`
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  orderId UUID NOT NULL FOREIGN KEY,
  productId UUID NOT NULL FOREIGN KEY,
  productVariantId UUID FOREIGN KEY (nullable),
  productName VARCHAR(255),
  quantity INTEGER,
  priceAtPurchase DECIMAL(10,2),
  totalPrice DECIMAL(12,2),
  status ENUM('pending', 'dispatched', 'delivered', 'cancelled', 'returned'),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### Relationships Established
```
User 1:1 Cart
Cart 1:N CartItem
Product 1:N CartItem

User 1:N ShippingAddress
User 1:N Order
Order 1:N OrderItem
ShippingAddress 1:N Order

Product 1:N OrderItem
ProductVariant 1:N OrderItem (optional)
```

---

## API Endpoints

### Cart Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/cart` | Get user's cart | ✓ |
| POST | `/api/cart/add` | Add item to cart | ✓ |
| PUT | `/api/cart/update/:cartItemId` | Update item quantity | ✓ |
| DELETE | `/api/cart/remove/:cartItemId` | Remove item from cart | ✓ |
| DELETE | `/api/cart/clear` | Clear entire cart | ✓ |

### Shipping Address Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/shipping-addresses` | Get all addresses | ✓ |
| GET | `/api/shipping-addresses/:addressId` | Get single address | ✓ |
| POST | `/api/shipping-addresses` | Create address | ✓ |
| PUT | `/api/shipping-addresses/:addressId` | Update address | ✓ |
| PATCH | `/api/shipping-addresses/:addressId/set-default` | Set as default | ✓ |
| DELETE | `/api/shipping-addresses/:addressId` | Delete address | ✓ |

### Order Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/orders` | Get all orders | ✓ |
| GET | `/api/orders/:orderId` | Get single order | ✓ |
| GET | `/api/orders/analytics/summary` | Get analytics | ✓ |
| POST | `/api/orders/place` | Place order | ✓ |
| PATCH | `/api/orders/:orderId/status` | Update status | ✓ |
| PATCH | `/api/orders/:orderId/payment-status` | Update payment | ✓ |
| POST | `/api/orders/:orderId/cancel` | Cancel order | ✓ |

---

## Error Handling & Edge Cases

### Stock Management
```javascript
// Edge Case: Product stock decreased after item added to cart
- Validates stock before adding
- Checks available stock during order placement
- Prevents overselling
- Restores stock on cancellation

// Error: "Only 5 items available"
```

### Cart Management
```javascript
// Edge Case: Adding existing item to cart
- Increments quantity instead of creating duplicate
- Recalculates total price

// Edge Case: Product becomes inactive
- Prevents adding inactive products
- Shows "Product not found or is inactive"
```

### Order Placement
```javascript
// Edge Case: Cart empty at checkout
- Error: "Cart is empty. Cannot place order"

// Edge Case: Product deleted before order
- Transaction rollback
- Error: "Product is no longer available"

// Edge Case: Insufficient stock for multiple items
- All items checked before order
- Clear error: "Insufficient stock for X. Available: Y"

// Edge Case: Shipping address deleted
- Validates address exists before order
- Error: "Shipping address not found"
```

### Payment & Cancellation
```javascript
// Edge Case: Cancelling already delivered order
- Error: "Cannot cancel order with status 'delivered'"

// Edge Case: Cancelling paid order
- Automatically sets paymentStatus to 'refunded'
- Restores all stock

// Edge Case: Deleting address in active order
- Prevents deletion
- Error: "Cannot delete address used in active orders"
```

### Status Transitions
```javascript
// Edge Case: Invalid status transition
- pending → confirmed ✓
- pending → shipped ✗ (requires confirmed first)
- Error: "Cannot change order status from 'pending' to 'shipped'"
```

### Data Validation
```javascript
// Email validation
- Normalizes to lowercase
- Validates format

// Phone validation
- Accepts 10-15 characters
- Allows digits, spaces, dashes, plus, parentheses

// Postal code validation
- Enforces 4-10 characters
- Prevents invalid formats

// Quantity validation
- Minimum 1 item
- Must be integer
- No negative quantities
```

---

## Setup Instructions

### 1. Install Dependencies
All required dependencies are already in `package.json`. Ensure you have:
```bash
npm install
```

### 2. Create Database
Run migrations to create tables:
```bash
npm run db:migrate
```

Or reset database (development only):
```bash
npm run db:reset
```

### 3. Start Server
```bash
npm run dev
```

Server will run on `http://localhost:5000`

### 4. Verify Installation
```bash
curl http://localhost:5000/api/health
```

---

## Testing Guide

### Prerequisites
1. Have a running server
2. Have auth token from login
3. Have test data in database

### 1. Test Cart Features

#### Add Item to Cart
```bash
TOKEN="your_auth_token"
PRODUCT_ID="product_uuid"

curl -X POST http://localhost:5000/api/cart/add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"quantity\": 2
  }"
```

#### Get Cart
```bash
curl -X GET http://localhost:5000/api/cart \
  -H "Authorization: Bearer $TOKEN"
```

#### Update Item Quantity
```bash
CART_ITEM_ID="cart_item_uuid"

curl -X PUT http://localhost:5000/api/cart/update/$CART_ITEM_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 5}'
```

#### Remove Item
```bash
curl -X DELETE http://localhost:5000/api/cart/remove/$CART_ITEM_ID \
  -H "Authorization: Bearer $TOKEN"
```

#### Clear Cart
```bash
curl -X DELETE http://localhost:5000/api/cart/clear \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Test Shipping Addresses

#### Create Address
```bash
curl -X POST http://localhost:5000/api/shipping-addresses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "phoneNumber": "9876543210",
    "email": "john@example.com",
    "addressLine1": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "isDefault": true
  }'
```

#### Get All Addresses
```bash
curl -X GET http://localhost:5000/api/shipping-addresses \
  -H "Authorization: Bearer $TOKEN"
```

#### Update Address
```bash
ADDRESS_ID="address_uuid"

curl -X PUT http://localhost:5000/api/shipping-addresses/$ADDRESS_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Los Angeles",
    "state": "CA"
  }'
```

### 3. Test Orders

#### Place Order
```bash
ADDRESS_ID="address_uuid"

curl -X POST http://localhost:5000/api/orders/place \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"shippingAddressId\": \"$ADDRESS_ID\",
    \"paymentMethod\": \"cod\",
    \"notes\": \"Please deliver after 5 PM\"
  }"
```

#### Get All Orders
```bash
curl -X GET http://localhost:5000/api/orders \
  -H "Authorization: Bearer $TOKEN"
```

#### Get Order Details
```bash
ORDER_ID="order_uuid"

curl -X GET http://localhost:5000/api/orders/$ORDER_ID \
  -H "Authorization: Bearer $TOKEN"
```

#### Update Order Status
```bash
curl -X PATCH http://localhost:5000/api/orders/$ORDER_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

#### Cancel Order
```bash
curl -X POST http://localhost:5000/api/orders/$ORDER_ID/cancel \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Changed my mind"}'
```

### 4. Test Edge Cases

#### Test Stock Validation
```bash
# Try adding more than available stock
curl -X POST http://localhost:5000/api/cart/add \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"productId": "$PRODUCT_ID", "quantity": 999}'
# Expected: Error "Only X items available"
```

#### Test Empty Cart Order
```bash
# Try placing order with empty cart
curl -X DELETE http://localhost:5000/api/cart/clear \
  -H "Authorization: Bearer $TOKEN"

curl -X POST http://localhost:5000/api/orders/place \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"shippingAddressId\": \"$ADDRESS_ID\"}"
# Expected: Error "Cart is empty"
```

#### Test Invalid Status Transition
```bash
# Try invalid transition
curl -X PATCH http://localhost:5000/api/orders/$ORDER_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "delivered"}'
# Expected: Error if not in valid transition path
```

---

## Architecture & Design Patterns

### Design Patterns Used

#### 1. **Service Layer Pattern**
- Controllers handle HTTP layer
- Models handle data layer
- Business logic in controllers

#### 2. **Transaction Pattern**
- Orders use database transactions
- Ensures atomicity of operations
- Rollback on any error

#### 3. **Validation Pattern**
- Express-validator for input validation
- Model-level validation for constraints
- Custom error messages

#### 4. **Error Handling Pattern**
- Custom AppError class
- Async/await with try-catch
- Global error handler middleware

#### 5. **Authorization Pattern**
- Token-based authentication
- Protect middleware for routes
- User ownership validation

### File Structure
```
backend_ecom/
├── controllers/
│   ├── cartController.js         (Cart operations)
│   ├── shippingAddressController.js  (Address CRUD)
│   ├── orderController.js        (Order operations)
│   └── ...
├── models/
│   ├── Cart.js
│   ├── CartItem.js
│   ├── ShippingAddress.js
│   ├── Order.js
│   ├── OrderItem.js
│   └── index.js (associations)
├── routes/
│   ├── cartRoutes.js
│   ├── shippingAddressRoutes.js
│   ├── orderRoutes.js
│   └── index.js (main router)
├── migrations/
│   ├── 20260324110000-create-carts.js
│   ├── 20260324120000-create-cart-items.js
│   ├── 20260324130000-create-shipping-addresses.js
│   ├── 20260324140000-create-orders.js
│   └── 20260324150000-create-order-items.js
├── CART_API.md
├── SHIPPING_ADDRESS_API.md
├── ORDER_API.md
└── IMPLEMENTATION_GUIDE.md (this file)
```

### Key Implementation Details

#### Stock Management
```javascript
// Before adding to cart:
1. Check product exists and is active
2. Check stock availability
3. Check variant stock (if applicable)
4. Calculate new total if item exists
5. Update cart totals atomically
```

#### Order Placement
```javascript
// Transaction-based approach:
1. Validate cart not empty
2. Validate all products available
3. Check stock for all items
4. Create order record
5. Create order items
6. Update product stock
7. Clear cart items
8. Commit transaction (or rollback on error)
```

#### Address Management
```javascript
// Default address handling:
1. When setting new default, unset all others
2. When deleting default, set another as default
3. Prevent deletion if in active orders
4. Validate address before use in order
```

---

## Future Enhancements

1. **Coupon System**: Add discount codes
2. **Shipping Zones**: Variable shipping based on location
3. **Order Tracking**: Real-time tracking updates
4. **Wishlist Integration**: Convert wishlist to cart
5. **Payment Gateway**: Razorpay/Stripe integration
6. **Inventory Management**: Low stock alerts
7. **Order Notifications**: Email/SMS updates
8. **Reviews & Ratings**: Linked to orders
9. **Return Management**: Return requests & process
10. **Analytics Dashboard**: Order trends & insights

---

## Common Issues & Solutions

### Issue: Stock validation fails
**Solution**: Ensure product stock is > 0 before testing

### Issue: Cannot create order
**Possible causes**:
- Cart is empty (add items first)
- Shipping address doesn't exist (create one first)
- Product stock is 0 (check product)
- Product is inactive

### Issue: Address deletion fails
**Possible causes**:
- Address is used in active order
- Address ID is incorrect
- Not authorized for this address

### Issue: Payment status update not working
**Solution**: Ensure payment status is valid (pending, completed, failed, refunded)

---

## Support & Documentation

For more details, see:
- [CART_API.md](./CART_API.md) - Cart API documentation
- [SHIPPING_ADDRESS_API.md](./SHIPPING_ADDRESS_API.md) - Address API documentation
- [ORDER_API.md](./ORDER_API.md) - Order API documentation

---

**Last Updated**: March 24, 2026
**Version**: 1.0.0
