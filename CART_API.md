# Cart API Documentation

## Overview
The Cart API allows users to manage their shopping cart, including adding, updating, and removing items.

## Base URL
`/api/cart`

## Authentication
All endpoints require authentication. Include the JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Get User's Cart
**GET** `/api/cart`

Retrieve the current user's shopping cart with all items.

#### Request
```bash
curl -X GET http://localhost:5000/api/cart \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "cart": {
      "id": "uuid",
      "userId": "uuid",
      "totalPrice": 5999.00,
      "totalItems": 3,
      "isActive": true,
      "createdAt": "2026-03-24T10:00:00Z",
      "updatedAt": "2026-03-24T10:00:00Z",
      "items": [
        {
          "id": "uuid",
          "cartId": "uuid",
          "productId": "uuid",
          "quantity": 2,
          "price": 999.00,
          "totalPrice": 1998.00,
          "product": {
            "id": "uuid",
            "name": "Product Name",
            "price": 999.00,
            "stock": 10,
            "originalPrice": 1499.00,
            "discountPercentage": 33.3
          },
          "variant": null
        }
      ]
    }
  }
}
```

#### Error Responses
- **401**: Unauthorized - No or invalid token provided
- **500**: Internal server error

---

### 2. Add Item to Cart
**POST** `/api/cart/add`

Add a product to the user's cart or increase quantity if already present.

#### Request Body
```json
{
  "productId": "uuid",
  "quantity": 2,
  "productVariantId": "uuid (optional)"
}
```

#### Request
```bash
curl -X POST http://localhost:5000/api/cart/add \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "550e8400-e29b-41d4-a716-446655440000",
    "quantity": 2
  }'
```

#### Response (201 Created)
```json
{
  "status": "success",
  "message": "Item added to cart successfully",
  "data": {
    "cart": {
      "id": "uuid",
      "userId": "uuid",
      "totalPrice": 1998.00,
      "totalItems": 2,
      "isActive": true,
      "items": [...]
    }
  }
}
```

#### Error Responses
- **400**: 
  - `Product ID is required`
  - `Quantity must be at least 1`
  - `Product not found or is inactive`
  - `Only X items available for this variant`
  - `Cannot add more items. Maximum X available`
- **401**: Unauthorized
- **404**: Product not found

---

### 3. Update Cart Item Quantity
**PUT** `/api/cart/update/:cartItemId`

Update the quantity of an item in the cart.

#### Request Parameters
- `cartItemId` (UUID): The ID of the cart item to update

#### Request Body
```json
{
  "quantity": 5
}
```

#### Request
```bash
curl -X PUT http://localhost:5000/api/cart/update/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 5
  }'
```

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "Cart item updated successfully",
  "data": {
    "cart": {...}
  }
}
```

#### Error Responses
- **400**: 
  - `Quantity must be at least 1`
  - `Only X items available`
  - `Variant no longer available`
- **401**: Unauthorized
- **403**: Unauthorized access to this cart
- **404**: Cart item not found

---

### 4. Remove Item from Cart
**DELETE** `/api/cart/remove/:cartItemId`

Remove an item from the user's cart.

#### Request Parameters
- `cartItemId` (UUID): The ID of the cart item to remove

#### Request
```bash
curl -X DELETE http://localhost:5000/api/cart/remove/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "Item removed from cart successfully",
  "data": {
    "cart": {...}
  }
}
```

#### Error Responses
- **401**: Unauthorized
- **403**: Unauthorized access to this cart
- **404**: Cart item not found

---

### 5. Clear Entire Cart
**DELETE** `/api/cart/clear`

Remove all items from the user's cart.

#### Request
```bash
curl -X DELETE http://localhost:5000/api/cart/clear \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "Cart cleared successfully",
  "data": {
    "cart": {
      "id": "uuid",
      "userId": "uuid",
      "totalPrice": 0,
      "totalItems": 0,
      "isActive": true
    }
  }
}
```

#### Error Responses
- **401**: Unauthorized
- **404**: Cart not found

---

## Edge Cases Handled

### Stock Management
- ✓ Validates product stock before adding to cart
- ✓ Checks if product is still active/available
- ✓ Prevents adding quantity exceeding available stock
- ✓ Updates available stock in real-time
- ✓ Validates variant stock if product variant is selected

### Quantity Validation
- ✓ Ensures quantity is at least 1
- ✓ Prevents negative quantities
- ✓ Validates quantity is an integer

### Cart Item Duplication
- ✓ If item already in cart, increases quantity instead of creating duplicate
- ✓ Checks combined quantity doesn't exceed stock

### Product Validation
- ✓ Verifies product exists
- ✓ Checks if product is active
- ✓ Validates product variant exists (if provided)
- ✓ Ensures variant is available

### User Authorization
- ✓ Prevents users from accessing other users' carts
- ✓ Ensures cart belongs to authenticated user

### Cart Persistence
- ✓ Creates cart automatically on first add
- ✓ Maintains cart across sessions
- ✓ Auto-calculates cart totals

---

## Data Types

### Cart Object
```json
{
  "id": "UUID",
  "userId": "UUID",
  "totalPrice": "Decimal(12,2)",
  "totalItems": "Integer",
  "isActive": "Boolean",
  "createdAt": "ISO 8601 DateTime",
  "updatedAt": "ISO 8601 DateTime"
}
```

### CartItem Object
```json
{
  "id": "UUID",
  "cartId": "UUID",
  "productId": "UUID",
  "productVariantId": "UUID (nullable)",
  "quantity": "Integer",
  "price": "Decimal(10,2)",
  "totalPrice": "Decimal(12,2)",
  "createdAt": "ISO 8601 DateTime",
  "updatedAt": "ISO 8601 DateTime"
}
```

---

## Examples

### Add Multiple Items
```bash
# Add laptop
curl -X POST http://localhost:5000/api/cart/add \
  -H "Authorization: Bearer <token>" \
  -d '{"productId": "prod-001", "quantity": 1}'

# Add accessories
curl -X POST http://localhost:5000/api/cart/add \
  -H "Authorization: Bearer <token>" \
  -d '{"productId": "prod-002", "quantity": 2}'

# Increase laptop quantity
curl -X PUT http://localhost:5000/api/cart/update/cartitem-001 \
  -H "Authorization: Bearer <token>" \
  -d '{"quantity": 3}'
```

### Error Scenario: Insufficient Stock
```json
{
  "status": "error",
  "message": "Only 5 items available. Current stock: 5"
}
```
