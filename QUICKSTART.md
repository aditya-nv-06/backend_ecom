# Quick Start Guide - Cart, Shipping & Orders

## 🚀 Get Started in 5 Minutes

### Step 1: Run Migrations
```bash
npm run db:migrate
```

### Step 2: Start Server
```bash
npm run dev
```
Server runs on `http://localhost:5000`

### Step 3: Get Authentication Token
```bash
# Register/Login to get token
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
# Copy the token from response
```

### Step 4: Create Shipping Address
```bash
TOKEN="your_token_here"

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
# Copy the address ID
```

### Step 5: Add Items to Cart
```bash
# Get product ID from products list
PRODUCT_ID="product_uuid"

curl -X POST http://localhost:5000/api/cart/add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"quantity\": 2
  }"
```

### Step 6: Place Order
```bash
ADDRESS_ID="address_uuid"

curl -X POST http://localhost:5000/api/orders/place \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"shippingAddressId\": \"$ADDRESS_ID\",
    \"paymentMethod\": \"cod\",
    \"notes\": \"Please deliver in the evening\"
  }"
# Copy the order ID
```

### Step 7: Check Order Status
```bash
ORDER_ID="order_uuid"

curl -X GET http://localhost:5000/api/orders/$ORDER_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📚 Full Workflow Example

### Using Postman/cURL
```bash
#!/bin/bash

TOKEN="your_token"
BASE_URL="http://localhost:5000/api"

# 1. Get cart
echo "=== Getting Cart ==="
curl -X GET $BASE_URL/cart \
  -H "Authorization: Bearer $TOKEN"

# 2. Add product
echo -e "\n=== Adding to Cart ==="
curl -X POST $BASE_URL/cart/add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "550e8400-e29b-41d4-a716-446655440000",
    "quantity": 2
  }'

# 3. Create address
echo -e "\n=== Creating Address ==="
curl -X POST $BASE_URL/shipping-addresses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "phoneNumber": "9876543210",
    "email": "john@example.com",
    "addressLine1": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001"
  }'

# 4. Place order
echo -e "\n=== Placing Order ==="
curl -X POST $BASE_URL/orders/place \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddressId": "550e8400-e29b-41d4-a716-446655440001",
    "paymentMethod": "cod"
  }'

# 5. Get orders
echo -e "\n=== Getting Orders ==="
curl -X GET $BASE_URL/orders \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🧪 Testing Common Scenarios

### Scenario 1: Stock Validation
```bash
# Try adding more than available
curl -X POST http://localhost:5000/api/cart/add \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "productId": "prod-id",
    "quantity": 9999
  }'
# Should error: "Only X items available"
```

### Scenario 2: Empty Cart Order
```bash
# Clear cart then try to order
curl -X DELETE http://localhost:5000/api/cart/clear \
  -H "Authorization: Bearer $TOKEN"

curl -X POST http://localhost:5000/api/orders/place \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"shippingAddressId": "addr-id"}'
# Should error: "Cart is empty"
```

### Scenario 3: Cancel Order
```bash
curl -X POST http://localhost:5000/api/orders/$ORDER_ID/cancel \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reason": "Changed my mind"}'
# Stock will be restored
```

---

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| [CART_API.md](./CART_API.md) | Complete Cart API reference |
| [SHIPPING_ADDRESS_API.md](./SHIPPING_ADDRESS_API.md) | Address API reference |
| [ORDER_API.md](./ORDER_API.md) | Order API reference |
| [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) | Setup & architecture |
| [FEATURES_SUMMARY.md](./FEATURES_SUMMARY.md) | Feature overview |

---

## 🔍 Debugging Tips

### Check Cart Items
```bash
curl -X GET http://localhost:5000/api/cart \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Check All Addresses
```bash
curl -X GET http://localhost:5000/api/shipping-addresses \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Check All Orders
```bash
curl -X GET http://localhost:5000/api/orders \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Get Filtered Orders
```bash
# Get only shipped orders
curl -X GET "http://localhost:5000/api/orders?status=shipped" \
  -H "Authorization: Bearer $TOKEN" | jq

# Get by payment status
curl -X GET "http://localhost:5000/api/orders?paymentStatus=completed" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Get Order Analytics
```bash
curl -X GET http://localhost:5000/api/orders/analytics/summary \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## ⚙️ Configuration

### Configurable Values (in orderController.js)

```javascript
// Shipping cost (line ~200)
const shippingCost = 50;  // Change this value

// Tax rate (line ~201)
const taxAmount = Math.round((subtotal * 5) / 100);  // Change 5 to desired percentage

// Estimated delivery days (line ~202)
estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)  // Change 7 to desired days
```

---

## 🎯 Common API Patterns

### Add to Cart
```javascript
POST /api/cart/add
{
  "productId": "uuid",
  "quantity": 1,
  "productVariantId": "uuid" // optional
}
```

### Place Order
```javascript
POST /api/orders/place
{
  "shippingAddressId": "uuid",
  "paymentMethod": "cod", // or credit_card, debit_card, upi, net_banking, wallet
  "notes": "optional notes"
}
```

### Update Order Status
```javascript
PATCH /api/orders/:orderId/status
{
  "status": "confirmed" // pending→confirmed→processing→shipped→delivered
}
```

---

## 🚨 Error Responses

### Stock Unavailable
```json
{
  "status": "error",
  "message": "Only 5 items available. Current stock: 5"
}
```

### Cart Empty
```json
{
  "status": "error",
  "message": "Cart is empty. Cannot place order"
}
```

### Invalid Status
```json
{
  "status": "error",
  "message": "Cannot change order status from 'pending' to 'delivered'"
}
```

### Unauthorized
```json
{
  "status": "error",
  "message": "Unauthorized access to this order"
}
```

---

## ✅ Validation Rules Quick Reference

| Field | Rules |
|-------|-------|
| productId | Required, UUID |
| quantity | Required, >= 1, integer |
| fullName | 2-100 characters |
| phoneNumber | 10-15 digits |
| email | Valid email format |
| postalCode | 4-10 characters |
| status | pending/confirmed/processing/shipped/delivered/cancelled/returned |
| paymentMethod | cod/credit_card/debit_card/upi/net_banking/wallet |

---

## 🔐 Authentication

All endpoints require Bearer token:
```bash
-H "Authorization: Bearer <token>"
```

Get token from login/register response.

---

## 📊 Sample Response Format

```json
{
  "status": "success",
  "message": "optional message",
  "data": {
    "key": "value"
  }
}
```

---

## 🎓 Next Steps

1. Read [FEATURES_SUMMARY.md](./FEATURES_SUMMARY.md) for complete overview
2. Check [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for architecture
3. Review API docs for detailed endpoint information
4. Test all endpoints with provided examples
5. Integrate payment gateway when ready

---

## 💡 Tips

- Always include `Authorization` header
- Use pagination for list endpoints (default page=1, limit=10)
- Check UUIDs are correctly formatted
- Use provided validation in request bodies
- Always validate response status field

---

**Ready to start?** Run `npm run dev` and begin testing! 🚀
