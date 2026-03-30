# Coupon API Documentation

## Overview
The Coupon API allows users to apply discount codes to their carts and enables administrators to manage promotional offerings.

## Base URL
`/api/coupons`

---

## User Endpoints

### 1. Get Available Coupons
**GET** `/api/coupons`

List all active coupons currently available for use.

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "coupons": [
      {
        "code": "SAVE20",
        "type": "percentage",
        "value": 20.00,
        "minOrderAmount": 500.00,
        "maxDiscountAmount": 200.00,
        "endDate": "2026-12-31T23:59:59Z"
      }
    ]
  }
}
```

---

### 2. Apply Coupon
**POST** `/api/coupons/apply`

Apply a coupon code to the user's active cart.

#### Request Body
```json
{
  "code": "SAVE20"
}
```

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "Coupon applied successfully",
  "data": {
    "coupon": {
      "code": "SAVE20",
      "type": "percentage",
      "value": 20.00,
      "maxDiscountAmount": 200.00
    }
  }
}
```

---

### 3. Remove Coupon
**DELETE** `/api/coupons/remove`

Remove the applied coupon from the user's active cart.

---

## Admin Endpoints
*Requires admin role.*

### 1. List All Coupons
**GET** `/api/coupons/admin`

### 2. Create Coupon
**POST** `/api/coupons/admin`

#### Request Body
```json
{
  "code": "NEWYEAR",
  "type": "fixed",
  "value": 100.00,
  "minOrderAmount": 1000.00,
  "startDate": "2026-01-01T00:00:00Z",
  "endDate": "2026-01-15T23:59:59Z",
  "usageLimit": 500,
  "userUsageLimit": 1
}
```

---

## Coupon Logic
- **Percentage**: Calculates discount as a percentage of cart subtotal (capped by `maxDiscountAmount`).
- **Fixed**: Subtracts a fixed amount from the cart subtotal.
- **Validation**:
  - Checks if the coupon is active and within its date range.
  - Verifies cart subtotal meets `minOrderAmount`.
  - Checks `usageLimit` (overall) and `userUsageLimit` (per user).
