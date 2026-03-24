📌 Internal Developer Documentation – E-Commerce Backend

## 1. Purpose

This document provides comprehensive internal documentation for developers working on the e-commerce backend. It covers architecture, modules, functions, database models, APIs, and best practices.

## 2. System Architecture

### Technology Stack

- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: Helmet, CORS, rate limiting, XSS protection, HPP
- **Payments**: Razorpay integration
- **Scheduling**: node-cron for background jobs
- **UUID**: For unique identifiers

### Request Flow

```
Client Request → Route Handler → Validation Middleware → Auth Middleware → Controller → Service Layer → Model → Database
```

### Project Structure

```
├── config/                 # Database and app configuration
│   ├── config.js          # Sequelize environment configs
│   ├── database.js        # DB connection and sync logic
│   └── sequelize.js       # Sequelize instance setup
├── constants/             # Application constants
│   ├── order.js           # Order statuses, delivery charges
│   └── delivery.js        # Warehouse and shipping data
├── controllers/           # Route handlers (business logic)
│   ├── productController.js      # Product CRUD operations
│   ├── cartController.js         # Cart management
│   ├── checkoutController.js     # Checkout and coupon logic
│   ├── orderController.js        # Order processing
│   ├── addressController.js      # User addresses
│   ├── productVariantController.js # Product variants
│   ├── qaController.js           # Q&A system
│   ├── ReviewController.js       # Reviews and ratings
│   └── wishlist.controller.js    # Wishlist management
├── middlewares/           # Express middlewares
│   ├── auth.middleware.js        # JWT authentication
│   ├── errorHandler.js           # Centralized error handling
│   ├── validateRequest.js        # express-validator wrapper
│   └── autoCancelOrders.js       # Cron job for order cancellation
├── migrations/            # Database schema migrations
├── models/                # Sequelize models and associations
│   ├── index.js           # Model associations
│   ├── Product.js         # Product model
│   ├── Coupon.js          # Coupon model
│   └── [other models...]
├── routes/                # Express route definitions
│   ├── checkout.js        # Checkout routes with validation
│   └── [other routes...]
├── services/              # Business logic services
│   └── checkoutService.js # Checkout operations
├── utils/                 # Utility functions
│   ├── generateToken.js   # Test user/token generation
│   ├── deliveryUtils.js   # Delivery calculations
│   ├── orderUtils.js      # Order utilities
│   └── pricingService.js  # Pricing calculations
└── server.js              # Application entry point
```

## 3. Core Modules Documentation

### Controllers

#### productController.js

**Purpose**: Handles all product-related operations including CRUD, search, and recommendations.

**Key Functions**:

- `getProducts(req, res, next)`: Lists products with pagination, filtering, and search
  - **Params**: `page`, `limit`, `category`, `search`
  - **Returns**: Paginated product list with images and variants
- `getProductById(req, res, next)`: Retrieves single product details
- `searchProducts(req, res, next)`: Searches products by name/description
- `getRelatedProducts(req, res, next)`: Smart product recommendations
- `createProduct(req, res, next)`: Creates new product with variants/images (Admin only)
- `updateProduct(req, res, next)`: Updates product details (Admin only)
- `deleteProduct(req, res, next)`: Soft deletes product (Admin only)

#### cartController.js

**Purpose**: Manages shopping cart operations.

**Key Functions**:

- `createCart(req, res, next)`: Creates new cart (session or user-based)
- `getCart(req, res, next)`: Retrieves cart with items
- `addItem(req, res, next)`: Adds product to cart with stock validation
- `updateItem(req, res, next)`: Updates item quantity
- `removeItem(req, res, next)`: Removes single item
- `clearCart(req, res, next)`: Removes all items from cart

#### checkoutController.js

**Purpose**: Handles checkout process including coupon application and order placement.

**Key Functions**:

- `checkoutDetails(req, res, next)`: Returns checkout summary with cart, addresses, pricing
- `selectCheckoutAddress(req, res, next)`: Associates address with cart
- `applyCouponCode(req, res, next)`: Validates and applies coupon discounts
- `placeOrderHandler(req, res, next)`: Creates order from cart

#### orderController.js

**Purpose**: Manages order lifecycle from creation to payment.

**Key Functions**:

- `buyItNow(req, res, next)`: Immediate purchase flow
- `addAddressToOrder(req, res, next)`: Adds shipping address to order
- `createPaymentOrder(req, res, next)`: Creates Razorpay payment order
- `verifyPayment(req, res, next)`: Verifies payment and updates order status

### Services

#### checkoutService.js

**Purpose**: Contains complex checkout business logic.

**Key Functions**:

- `getCheckoutDetails(userId, cartId)`: Calculates checkout summary
- `selectAddressForCart(userId, cartId, addressId)`: Links address to cart
- `applyCouponToCart(userId, cartId, couponCode)`: Applies coupon with validation
  - **Validations**: Code existence, dates, usage limits, min order value
  - **Returns**: Discount amount, final pricing
- `placeOrderFromCart(params)`: Creates order with stock deduction and address

### Middlewares

#### auth.middleware.js

**Purpose**: JWT authentication and authorization.

**Key Features**:

- Verifies JWT tokens from Authorization header
- Supports mock user for testing (MOCK_USER_ID env var)
- Sets `req.user` with id, email, role
- `requireAdmin` middleware for admin-only routes

#### errorHandler.js

**Purpose**: Centralized error handling and response formatting.

**Handles**:

- Sequelize validation errors
- Custom application errors with statusCode
- General server errors

#### validateRequest.js

**Purpose**: Processes express-validator results and returns formatted errors.

#### autoCancelOrders.js

**Purpose**: Background job to cancel pending orders after 24 hours.

**Logic**:

- Runs hourly via cron
- Finds orders older than 24 hours with PENDING status
- Restores product stock
- Updates order status to CANCELLED

### Models

#### Product.js

**Fields**:

- `id`: UUID primary key
- `name`: String, required
- `description`: Text
- `originalPrice`: Decimal(10,2), required
- `discountPercentage`: Float, default 0
- `price`: Decimal(10,2), auto-calculated
- `rating`: Float, default 0
- `totalReviews`: Integer, default 0
- `stock`: Integer, default 0
- `category`: String, required
- `soldCount`: Integer, default 0
- `isActive`: Boolean, default true

**Hooks**:

- `beforeSave`: Calculates final price from original price and discount

#### Coupon.js

**Fields**:

- `code`: String, unique, required
- `discountType`: ENUM('PERCENTAGE', 'FLAT'), required
- `discountValue`: Decimal(10,2), required
- `minOrderValue`: Decimal(10,2), default 0
- `maxDiscountAmount`: Decimal(10,2), nullable (for percentage caps)
- `startDate`: Date, nullable
- `expiryDate`: Date, required
- `maxUsage`: Integer, nullable (unlimited if null)
- `usedCount`: Integer, default 0
- `isActive`: Boolean, default true

#### Order.js

**Fields**:

- `userId`: UUID, foreign key
- `status`: ENUM('PENDING', 'PAID', 'CANCELLED', 'SHIPPED', 'DELIVERED')
- `totalAmount`: Decimal(10,2)
- `discount`: Decimal(10,2), default 0
- `deliveryCharge`: Decimal(10,2), default 50
- `finalAmount`: Decimal(10,2)
- `paymentId`: String (Razorpay payment ID)
- `addressId`: UUID, foreign key to OrderAddress

### Utilities

#### generateToken.js

**Purpose**: Creates test users and generates JWT tokens for development.

**Creates Users**:

- Admin: <admin@example.com> / Admin@123
- User: <user@example.com> / User@123

**Output**: JWT tokens for testing API endpoints

#### deliveryUtils.js

**Purpose**: Calculates delivery estimates based on warehouse locations.

**Constants**:

- Warehouses with cities, states, lead times
- Shipping speeds (STANDARD: 2-5 days, EXPRESS: 1-2 days)

## 4. API Router Summary

| Route | Controller | Description |
|-------|------------|-------------|
| `/api/products` | productController | Public product operations |
| `/api/admin/products` | productController | Admin product management |
| `/api/product-variants` | productVariantController | Product variant queries |
| `/api/carts` | cartController | Cart management |
| `/api/checkout` | checkoutController | Checkout process |
| `/api/orders` | orderController | Order lifecycle |
| `/api/addresses` | addressController | User addresses |
| `/api/reviews` | ReviewController | Product reviews |
| `/api/qa` | qaController | Q&A system |
| `/api/wishlist` | wishlist.controller | Wishlist management |

## 5. Authentication/Authorization

### JWT Token Structure

```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "role": "USER" | "ADMIN"
}
```

### Protected Routes

- All `/api/carts`, `/api/checkout`, `/api/orders`, `/api/addresses`, `/api/reviews`, `/api/wishlist` routes
- Admin routes: `/api/admin/*`

### Mock Authentication

Set `MOCK_USER_ID` in .env for testing without JWT tokens.

## 6. Route Contracts

### Products

- **Public**: List, search, get by ID, related products, full details
- **Admin**: Create, update, delete (soft delete via isActive = false)

### Cart

- Create cart (session or user-based)
- Add/update/remove items with stock validation
- Clear entire cart

### Checkout

- Get checkout details (cart + addresses + pricing)
- Select delivery address
- Apply coupon (optional, with comprehensive validation)
- Place order (creates order, deducts stock, links address)

### Orders

- Buy now (immediate purchase)
- Add address to order
- Create payment order (Razorpay)
- Verify payment (updates status, increments sold count)

### Reviews

- CRUD operations per product
- Rating aggregation (auto-updates product rating/totalReviews)

### Q&A

- Users can ask questions
- Admins can answer questions
- CRUD for questions

## 7. Validation Rules

### Express-Validator Rules

- `cartId`, `productId`, `variantId`, `addressId`, `orderId`: Must be valid UUIDs
- `quantity`: Integer, minimum 1
- `rating`: Integer, 1-5
- `couponCode`: Optional string, converted to uppercase
- `paymentMethod`: Must be one of ['COD', 'UPI', 'CARD']

### Business Logic Validation

- Product must be active and in stock
- Cart items must have sufficient stock
- Coupons must be active, within date range, under usage limits
- Orders cannot be modified after PAID status
- Addresses must belong to authenticated user

## 8. Error Handling

### Error Response Format

```json
{
  "message": "Error description",
  "errors": ["Detailed validation errors"] // for validation errors
}
```

### Custom Errors

Controllers throw errors with `statusCode` property for HTTP status codes.

### Database Transactions

Used in:

- Product creation (with variants/images/specs)
- Cart operations (stock validation)
- Order placement (stock deduction, order creation)
- Review updates (rating aggregation)

## 9. Database Relationships

### Core Relationships

- **User** → **Cart** (1:N)
- **User** → **Order** (1:N)
- **User** → **UserAddress** (1:N)
- **User** → **Review** (1:N)
- **User** → **Wishlist** (1:N)
- **Product** → **ProductVariant** (1:N)
- **Product** → **ProductImage** (1:N)
- **Product** → **ProductSpecification** (1:1)
- **Product** → **Review** (1:N)
- **Product** → **Question** (1:N)
- **Cart** → **CartItem** (1:N)
- **Order** → **OrderItem** (1:N)
- **Order** → **OrderAddress** (1:1)

### Foreign Key Constraints

All relationships use CASCADE delete where appropriate, with hooks for cleanup.

## 10. Transaction Usage

### Critical Transactions

1. **Product Creation**: Creates product + variants + images + specs atomically
2. **Cart Item Addition**: Validates stock before adding
3. **Order Placement**: Deducts stock, creates order/items/address in single transaction
4. **Review Operations**: Updates product rating aggregation atomically
5. **Payment Verification**: Updates order status and product sold counts

### Isolation Levels

Uses Sequelize default (READ COMMITTED) for consistency.

## 11. Security and Best Practices

### Implemented Security

- **Helmet**: Security headers
- **CORS**: Configured origins
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **XSS Protection**: Sanitizes input
- **HPP**: Prevents HTTP parameter pollution
- **MongoDB Sanitize**: Prevents NoSQL injection
- **Input Validation**: All inputs validated
- **JWT**: Secure authentication
- **Password Hashing**: bcrypt with salt rounds

### Code Quality

- **MVC Architecture**: Clear separation of concerns
- **Error Handling**: Centralized error responses
- **Validation**: Input sanitization and validation
- **Transactions**: Data consistency
- **Logging**: Development logging for debugging
- **Environment Config**: Sensitive data in .env

### Performance Considerations

- **Pagination**: All list endpoints paginated (default 10, max 50)
- **Indexing**: Assumed on foreign keys and commonly queried fields
- **Lazy Loading**: Related data loaded only when needed
- **Stock Locking**: Row-level locking for stock operations

## 12. Environment Variables

### Required

- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- `JWT_SECRET`
- `PORT`
- `CORS_ORIGIN`

### Optional

- `NODE_ENV` (development/production)
- `MOCK_USER_ID` (for testing)
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (for payments)
- `DB_DIALECT` (postgres/sqlite)

## 13. Development Workflow

### Local Development

1. Set up PostgreSQL database
2. Configure .env
3. Run migrations: `npx sequelize-cli db:migrate`
4. Generate test tokens: `node utils/generateToken.js`
5. Start server: `npm run dev`

### Testing API

Use generated JWT tokens for authentication:

- Admin: `Bearer eyJ...`
- User: `Bearer eyJ...`

### Database Changes

1. Create migration: `npx sequelize-cli migration:generate --name migration-name`
2. Edit migration file
3. Run migration: `npx sequelize-cli db:migrate`
4. Update models if needed
5. Update associations in models/index.js

### Adding New Features

1. Create/update model
2. Add migration if schema changes
3. Create controller function
4. Add route with validation
5. Update service layer if complex logic
6. Add tests
7. Update documentation

## 14. Deployment Considerations

### Production Setup

- Set `NODE_ENV=production`
- Use production database
- Configure proper CORS origins
- Set up SSL/TLS
- Use process manager (PM2)
- Set up monitoring and logging
- Configure backup strategy

### Scaling Considerations

- Database connection pooling configured
- Stateless design (horizontal scaling ready)
- File uploads should use cloud storage (not implemented)
- Caching layer recommended for production
- CDN for static assets

## 15. Troubleshooting

### Common Issues

- **Port conflicts**: Check if port 5000 is available
- **Database connection**: Verify PostgreSQL is running and credentials correct
- **Migrations**: Ensure migrations run before starting server
- **JWT tokens**: Regenerate if expired (1 hour expiry)
- **CORS errors**: Check CORS_ORIGIN in .env

### Debug Mode

Set `NODE_ENV=development` for detailed logging and error stack traces.

- Ownership checks in controllers (validate `req.user.id` before modifying cart/wishlist/review)
- Input validation and sanitize requests

1. Developer setup

- `npm install`
- `npm run dev`
- `GET /` health check

1. Future improvements

- Add logging (Winston)
- Add unit/integration tests (Jest + supertest)
- Add Redis caching for listing endpoints
- Docker support
