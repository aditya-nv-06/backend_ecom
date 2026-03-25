🌐 External API Documentation – E-Commerce Backend

Base URL: `http://localhost:5000/api`

---

## 🔐 Authentication

All protected routes require JWT Bearer token in header:

```
Authorization: Bearer <token>
```

**Admin routes** require user role = `ADMIN`

**Default test tokens** (run `node utils/generateToken.js`):

- **Admin**: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **User**: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

❗ **Status Codes**:

- `200` OK
- `201` Created
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `500` Internal Server Error

**Response Format**:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": { "total": 100, "page": 1, "limit": 10 }
}
```

---

## 🛍️ Products API

### Public Endpoints

#### GET /api/products

**List products with pagination and filtering**

**Query Parameters**:

- `page` (number, default: 1): Page number
- `limit` (number, default: 10, max: 50): Items per page
- `category` (string, optional): Filter by category
- `search` (string, optional): Search in name/description

**Response**:

```json
{
  "success": true,
  "message": "Products fetched successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "description": "Product description",
      "originalPrice": 100.00,
      "discountPercentage": 10,
      "price": 90.00,
      "rating": 4.5,
      "totalReviews": 25,
      "stock": 50,
      "category": "Electronics",
      "images": [
        { "id": "uuid", "imageUrl": "https://..." }
      ],
      "variants": [
        { "id": "uuid", "color": "Red", "stock": 20, "price": 90.00 }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

#### GET /api/products/search

**Search products**

**Query Parameters**:

- `key` (string, required): Search term
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 50)

**Response**: Same as GET /api/products

#### GET /api/products/:id

**Get product details**

**Response**:

```json
{
  "success": true,
  "message": "Product fetched successfully",
  "data": {
    "id": "uuid",
    "name": "Product Name",
    "description": "Product description",
    "originalPrice": 100.00,
    "price": 90.00,
    "rating": 4.5,
    "totalReviews": 25,
    "stock": 50,
    "category": "Electronics",
    "images": [...],
    "specifications": { "key": "value" },
    "variants": [...]
  }
}
```

#### GET /api/products/:id/full

**Get complete product with all relations**

**Response**: Same as above but includes all related data

#### GET /api/products/:id/related

**Get related products**

**Response**:

```json
{
  "success": true,
  "message": "Smart recommendations fetched",
  "data": [...]
}
```

### Admin Endpoints (Auth + Admin required)

#### GET /api/admin/products

**List products for admin management**

**Same parameters as public endpoint**

#### POST /api/admin/products

**Create new product**

**Request Body**:

```json
{
  "name": "Product Name",
  "description": "Product description",
  "originalPrice": 100.00,
  "discountPercentage": 10,
  "category": "Electronics",
  "stock": 50,
  "images": ["https://image1.jpg", "https://image2.jpg"],
  "specifications": { "brand": "Brand Name", "warranty": "1 year" },
  "variants": [
    { "color": "Red", "stock": 20, "price": 90.00 },
    { "color": "Blue", "stock": 30, "price": 90.00 }
  ]
}
```

**Response**:

```json
{
  "success": true,
  "message": "Product created",
  "data": { "id": "uuid", "name": "Product Name", ... }
}
```

#### PUT /api/admin/products/:id

**Update product**

**Request Body**: Same as create, all fields optional

**Response**:

```json
{
  "success": true,
  "message": "Product updated",
  "data": { ... }
}
```

#### DELETE /api/admin/products/:id

**Delete product (soft delete)**

**Response**:

```json
{
  "success": true,
  "message": "Product deleted"
}
```

---

## 🧩 Product Variants API

#### GET /api/product-variants/:productId/variants

**Get all variants for a product**

**Response**:

```json
{
  "success": true,
  "data": [
    { "id": "uuid", "color": "Red", "stock": 20, "price": 90.00 },
    { "id": "uuid", "color": "Blue", "stock": 30, "price": 90.00 }
  ]
}
```

#### GET /api/product-variants/:productId/variant

**Get specific variant by color**

**Query Parameters**:

- `color` (string, required): Variant color

**Response**:

```json
{
  "success": true,
  "data": { "id": "uuid", "color": "Red", "stock": 20, "price": 90.00 }
}
```

---

## 🛒 Cart API (Auth required)

#### POST /api/carts

**Create a new cart**

**Request Body**:

```json
{
  "sessionId": "optional-session-id"
}
```

**Response**:

```json
{
  "success": true,
  "cart": { "id": "uuid", "userId": "uuid", "sessionId": "session-id" }
}
```

#### GET /api/carts/:cartId

**Get cart with items**

**Response**:

```json
{
  "success": true,
  "cart": {
    "id": "uuid",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "variantId": "uuid",
        "quantity": 2,
        "priceAtAdd": 90.00,
        "product": { "id": "uuid", "name": "Product Name" },
        "variant": { "id": "uuid", "color": "Red" }
      }
    ]
  }
}
```

#### POST /api/carts/:cartId/items

**Add item to cart**

**Request Body**:

```json
{
  "productId": "uuid",
  "variantId": "uuid", // optional
  "quantity": 1
}
```

**Response**:

```json
{
  "success": true,
  "item": { "id": "uuid", "cartId": "uuid", "quantity": 1, ... }
}
```

#### PUT /api/carts/:cartId/items/:itemId

**Update item quantity**

**Request Body**:

```json
{
  "quantity": 3
}
```

**Response**:

```json
{
  "success": true,
  "item": { "id": "uuid", "quantity": 3, ... }
}
```

#### DELETE /api/carts/:cartId/items/:itemId

**Remove item from cart**

**Response**:

```json
{
  "success": true,
  "message": "Item removed"
}
```

#### DELETE /api/carts/:cartId/items

**Clear all items in cart**

**Response**:

```json
{
  "success": true,
  "message": "Cart cleared"
}
```

---

## 🛍️ Checkout API (Auth required)

#### GET /api/checkout/details

**Get checkout details**

**Query Parameters**:

- `cartId` (string, required): Cart ID

**Response**:

```json
{
  "success": true,
  "data": {
    "cartItems": [
      {
        "id": "uuid",
        "productId": "uuid",
        "name": "Product Name",
        "quantity": 2,
        "price": 90.00,
        "color": "Red"
      }
    ],
    "addresses": [
      {
        "id": "uuid",
        "name": "John Doe",
        "city": "Bangalore",
        "state": "Karnataka",
        "isSelected": true
      }
    ],
    "summary": {
      "subtotal": 180.00,
      "discount": 0,
      "deliveryCharge": 50,
      "finalAmount": 230.00
    },
    "paymentMethods": ["COD", "UPI", "CARD"],
    "delivery": {
      "minDays": 3,
      "maxDays": 5,
      "estimatedDate": "2024-01-04",
      "deliveryWindow": "3-5 days"
    }
  }
}
```

#### POST /api/checkout/select-address

**Select delivery address**

**Request Body**:

```json
{
  "cartId": "uuid",
  "addressId": "uuid"
}
```

**Response**:

```json
{
  "success": true,
  "cart": { "id": "uuid", "selectedAddressId": "uuid", ... },
  "message": "Address selected"
}
```

#### POST /api/checkout/coupon/apply

**Apply coupon code**

**Request Body**:

```json
{
  "cartId": "uuid",
  "couponCode": "SAVE10" // optional
}
```

**Response** (with coupon):

```json
{
  "success": true,
  "couponCode": "SAVE10",
  "discount": 18.00,
  "subtotal": 180.00,
  "finalAmount": 212.00,
  "message": "Coupon SAVE10 applied successfully. You saved ₹18.00"
}
```

**Response** (without coupon):

```json
{
  "success": true,
  "couponCode": null,
  "discount": 0,
  "subtotal": 180.00,
  "finalAmount": 230.00,
  "message": "No coupon applied"
}
```

#### POST /api/checkout/order/place

**Place order**

**Request Body**:

```json
{
  "cartId": "uuid",
  "addressId": "uuid",
  "paymentMethod": "COD"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Order placed",
  "order": { "id": "uuid", "status": "PENDING", ... },
  "items": [...],
  "estimatedDelivery": { "minDays": 3, "maxDays": 5 }
}
```

---

## 📦 Orders API (Auth required)

#### POST /api/orders/buy-now

**Buy product immediately**

**Request Body**:

```json
{
  "productId": "uuid",
  "color": "Red",
  "quantity": 1
}
```

**Response**:

```json
{
  "success": true,
  "message": "Order created. Add address to proceed.",
  "order": { "id": "uuid", "status": "PENDING", ... }
}
```

#### POST /api/orders/add-address

**Add address to order**

**Request Body**:

```json
{
  "orderId": "uuid",
  "address": {
    "name": "John Doe",
    "phone": "9876543210",
    "street": "123 Main St",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001"
  }
}
```

**Response**:

```json
{
  "success": true,
  "message": "Address added successfully",
  "orderAddress": { "id": "uuid", ... }
}
```

#### POST /api/orders/create-payment

**Create payment order**

**Request Body**:

```json
{
  "orderId": "uuid"
}
```

**Response**:

```json
{
  "success": true,
  "payment": {
    "id": "order_xyz123",
    "amount": "230.00",
    "currency": "INR"
  }
}
```

#### POST /api/orders/verify-payment

**Verify payment**

**Request Body**:

```json
{
  "orderId": "uuid"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Payment verified successfully",
  "order": { "id": "uuid", "status": "PAID", ... }
}
```

---

## 📍 Address API (Auth required)

#### POST /api/addresses

**Add new address**

**Request Body**:

```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "street": "123 Main St",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560001",
  "isDefault": false
}
```

**Response**:

```json
{
  "success": true,
  "message": "Address added",
  "data": { "id": "uuid", ... }
}
```

#### GET /api/addresses

**Get user addresses**

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "phone": "9876543210",
      "street": "123 Main St",
      "city": "Bangalore",
      "state": "Karnataka",
      "pincode": "560001",
      "isDefault": true
    }
  ]
}
```

#### PUT /api/addresses/:id

**Update address**

**Request Body**: Same as add, all fields optional

**Response**:

```json
{
  "success": true,
  "message": "Address updated",
  "data": { ... }
}
```

#### DELETE /api/addresses/:id

**Delete address**

**Response**:

```json
{
  "success": true,
  "message": "Address deleted"
}
```

#### PUT /api/addresses/:id/default

**Set as default address**

**Response**:

```json
{
  "success": true,
  "message": "Default address set",
  "data": { ... }
}
```

---

## ⭐ Reviews API (Auth required)

#### POST /api/reviews/:productId

**Add review**

**Request Body**:

```json
{
  "rating": 5,
  "comment": "Great product!"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Review added successfully",
  "data": { "id": "uuid", "rating": 5, "comment": "Great product!" }
}
```

#### GET /api/reviews/:productId

**Get product reviews**

**Query Parameters**:

- `page` (number, default: 1)
- `limit` (number, default: 10, max: 50)
- `rating` (number, optional): Filter by rating
- `sort` (string, default: "latest"): "latest", "oldest", "high", "low"

**Response**:

```json
{
  "success": true,
  "message": "Reviews fetched successfully",
  "data": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Great product!",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "total": 25, "page": 1, "limit": 10, "totalPages": 3 }
}
```

#### PUT /api/reviews/:reviewId

**Update review**

**Request Body**:

```json
{
  "rating": 4,
  "comment": "Updated review"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Review updated successfully",
  "data": { ... }
}
```

#### DELETE /api/reviews/:reviewId

**Delete review**

**Response**:

```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

## ❓ Q&A API

#### POST /api/user/qa/:productId

**Ask question**

**Request Body**:

```json
{
  "question": "Is this product available in blue color?"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Question added",
  "data": { "id": "uuid", "question": "Is this product available in blue color?" }
}
```

#### GET /api/user/qa/:productId

**Get product questions**

**Query Parameters**:

- `page` (number, default: 1)
- `limit` (number, default: 10, max: 50)

**Response**:

```json
{
  "success": true,
  "message": "Questions fetched",
  "data": [
    {
      "id": "uuid",
      "question": "Is this product available in blue color?",
      "answer": "Yes, we have it in blue.",
      "askedBy": { "id": "uuid", "name": "John Doe" },
      "answeredBy": { "id": "uuid", "name": "Admin User" },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "total": 5, "page": 1, "limit": 10, "totalPages": 1 }
}
```

#### PUT /api/user/qa/:questionId

**Update question (own questions only)**

**Request Body**:

```json
{
  "question": "Updated question"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Question updated",
  "data": { ... }
}
```

#### DELETE /api/user/qa/:questionId

**Delete question (own questions only)**

**Response**:

```json
{
  "success": true,
  "message": "Question deleted"
}
```

#### POST /api/admin/qa/:questionId

**Answer question (Admin only)**

**Request Body**:

```json
{
  "answer": "Yes, this product is available in blue color."
}
```

**Response**:

```json
{
  "success": true,
  "message": "Answer added/updated",
  "data": { ... }
}
```

---

## ❤️ Wishlist API (Auth required)

#### POST /api/wishlist

**Add to wishlist**

**Request Body**:

```json
{
  "productId": "uuid"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Added to wishlist",
  "data": { "id": "uuid", "productId": "uuid", ... }
}
```

#### GET /api/wishlist

**Get user wishlist**

**Query Parameters**:

- `page` (number, default: 1)
- `limit` (number, default: 10, max: 50)

**Response**:

```json
{
  "success": true,
  "message": "Wishlist fetched",
  "data": [
    {
      "id": "uuid",
      "productId": "uuid",
      "product": {
        "id": "uuid",
        "name": "Product Name",
        "price": 90.00,
        "rating": 4.5
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "total": 5, "page": 1, "limit": 10, "totalPages": 1 }
}
```

#### DELETE /api/wishlist/:productId

**Remove from wishlist**

**Response**:

```json
{
  "success": true,
  "message": "Removed from wishlist"
}
```

#### GET /api/wishlist/check/:productId

**Check if product is in wishlist**

**Response**:

```json
{
  "data": { "exists": true }
}
```

---

## 📊 Health Check

#### GET /

**Server health check**

**Response**:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## 🔧 Error Responses

### Validation Error

```json
{
  "message": "Validation failed",
  "errors": [
    { "param": "cartId", "msg": "cartId is required" },
    { "param": "quantity", "msg": "quantity must be at least 1" }
  ]
}
```

### Business Logic Error

```json
{
  "message": "Insufficient stock for Red variant"
}
```

### Authentication Error

```json
{
  "message": "Invalid token"
}
```

### Not Found Error

```json
{
  "message": "Product not found"
}
```

---

## 📋 Rate Limits

- **General**: 100 requests per 15 minutes per IP
- Applied to all routes except health check

---

## 🔒 Security Notes

- All sensitive data is validated and sanitized
- JWT tokens expire in 1 hour
- Passwords are hashed with bcrypt
- CORS configured for allowed origins only
- XSS and NoSQL injection protection enabled
- Security headers set via Helmet

---

## 🧪 Testing

Use the test tokens generated by `node utils/generateToken.js` for API testing. The tokens are valid for 1 hour.

Example curl command:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json" \
     http://localhost:5000/api/products
```

- Update item quantity

**DELETE /api/carts/:cartId/items/:itemId**

- Remove item from cart

**DELETE /api/carts/:cartId/items**

- Clear entire cart

---

## ❤️ Wishlist API (Auth required)

**POST /api/wishlist**

- Body: { productId }
- Add to wishlist (unique per user)

**GET /api/wishlist**

- Get user's wishlist

**DELETE /api/wishlist/:productId**

- Remove from wishlist

**GET /api/wishlist/check/:productId**

- Check if product is in wishlist

---

## ⭐ Reviews API

**POST /api/reviews/:productId/review** (Auth required)

- Body: { rating (1-5), comment }
- Create/update review (one per user per product)

**GET /api/reviews/:productId/reviews**

- Query: page, limit, rating, sort
- Get product reviews

**PUT /api/reviews/:reviewId** (Auth required)

- Update own review

**DELETE /api/reviews/:reviewId** (Auth required)

- Delete own review

---

## ❓ QA API

**POST /api/user/qa/:productId/questions** (Auth required)

- Body: { question }
- Ask question about product

**POST /api/admin/qa/questions/:questionId/answer** (Admin required)

- Body: { answer }
- Answer user question

**GET /api/user/qa/:productId/questions**

- Query: page, limit
- Get product Q&A

**PUT /api/user/qa/questions/:questionId** (Auth required)

- Update own question

**DELETE /api/user/qa/questions/:questionId** (Auth required)

- Delete own question

---

## 📍 Address API

**GET /api/admin/addresses** (Admin)

- Get all user addresses

**POST /api/admin/addresses** (Admin)

- Body: { userId, name, phone, street, city, state, postalCode, country }
- Create address for user

**GET /api/admin/addresses/:userId** (Admin)

- Get user's addresses

**PUT /api/admin/addresses/:id** (Admin)

- Update address

**DELETE /api/admin/addresses/:id** (Admin)

- Delete address

---

## 💳 Orders & Payments API (Auth required)

**POST /api/orders/buy**

- Body: { productId, variantId?, quantity }
- Create order for single product

**POST /api/orders/address**

- Body: { orderId, address: { name, phone, street, city, state, postalCode, country } }
- Add delivery address to order

**POST /api/orders/create-payment**

- Body: { orderId }
- Create Razorpay payment order

**POST /api/orders/verify**

- Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
- Verify payment and complete order

**GET /api/orders**

- Get user's orders

**GET /api/orders/:id**

- Get order details

---

## 🚀 Getting Started

1. Install dependencies: `npm install`
2. Set environment variables in .env:
   - DB_DIALECT=postgres
   - DB_HOST=localhost
   - DB_NAME=ecommerce
   - DB_USER=your_user
   - DB_PASSWORD=your_pass
   - JWT_SECRET=your_secret
   - RAZORPAY_KEY_ID=your_key
   - RAZORPAY_KEY_SECRET=your_secret
3. Run development server: `npm run dev`
4. Health check: `GET /` → `{ "status": "ok", "timestamp": "..." }`
5. Generate test tokens: `node utils/generateToken.js`

## 📋 Environment Variables

- PORT: Server port (default 5000)
- NODE_ENV: development/production
- CORS_ORIGIN: Comma-separated allowed origins
- DB_DIALECT: postgres/sqlite
- DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT
- SQLITE_STORAGE: Path for SQLite file
- JWT_SECRET: JWT signing secret
- RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

## 🔒 Security Features

- JWT authentication
- Password hashing
- Rate limiting (100 req/15min)
- XSS protection
- NoSQL injection prevention
- CORS configuration
- Input validation
