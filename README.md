# E-Commerce Backend API

A comprehensive RESTful API for an e-commerce application built with Express.js, PostgreSQL, and Sequelize ORM. Features JWT-based authentication with refresh tokens, shopping cart, shipping address management, and complete order processing system.

## Features

### Authentication & User Management
- ✅ User registration and authentication
- ✅ JWT access tokens (15 minutes expiry)
- ✅ JWT refresh tokens (7 days expiry)
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (user/admin)
- ✅ Google OAuth authentication

### Shopping Cart
- ✅ Add items to cart with stock validation
- ✅ Update item quantities
- ✅ Remove items from cart
- ✅ View cart with product details
- ✅ Real-time price calculations
- ✅ Duplicate item detection

### Shipping & Addresses
- ✅ Create multiple shipping addresses
- ✅ Set default address
- ✅ Update address details
- ✅ Delete addresses with active order protection
- ✅ Comprehensive address validation

### Order Management
- ✅ Place orders from cart
- ✅ View order history with filtering/pagination
- ✅ Track order status
- ✅ Update payment status
- ✅ Cancel orders with stock restoration
- ✅ Order analytics and summaries
- ✅ Estimated delivery tracking

### Product Management
- ✅ Browse products with filtering
- ✅ Product variants and specifications
- ✅ Product images management
- ✅ Wishlist functionality
- ✅ Product reviews and ratings
- ✅ Q&A support

### Technical Features
- ✅ Input validation with express-validator
- ✅ PostgreSQL database with Sequelize ORM
- ✅ Transaction support for orders
- ✅ Global error handling
- ✅ CORS enabled
- ✅ Security headers with Helmet
- ✅ Rate limiting
- ✅ Database indexing

## Tech Stack

- **Node.js** & **Express.js 5.2.1**
- **PostgreSQL** with **Sequelize ORM 6.37.7**
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **Helmet** for security headers
- **CORS** for cross-origin requests

## API Documentation

### Quick Links
- 🛒 [Cart API Documentation](./CART_API.md) - Shopping cart endpoints
- 📍 [Shipping Address API Documentation](./SHIPPING_ADDRESS_API.md) - Address management
- 📦 [Order API Documentation](./ORDER_API.md) - Order processing
- 🚀 [Quick Start Guide](./QUICKSTART.md) - Get started in 5 minutes
- 📚 [Implementation Guide](./IMPLEMENTATION_GUIDE.md) - Architecture & patterns
- ✨ [Features Summary](./FEATURES_SUMMARY.md) - Complete feature overview
- ✅ [Implementation Checklist](./IMPLEMENTATION_CHECKLIST.md) - What's implemented

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Quick Start (5 minutes)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run migrations:**
   ```bash
   npm run db:migrate
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

4. **Check health:**
   ```bash
   curl http://localhost:5000/api/health
   ```

See [QUICKSTART.md](./QUICKSTART.md) for detailed examples.

### Full Installation

1. **Clone repository:**
   ```bash
   git clone <repo-url>
   cd backend_ecom
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure your database and JWT secrets:
   ```env
   PORT=5000
   NODE_ENV=development
   
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=ecommerce_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   
   # JWT
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key
   JWT_REFRESH_EXPIRES_IN=7d
   
   CLIENT_URL=http://localhost:3000
   ```

3. **Create the database:**
   ```bash
   # Using psql
   psql -U postgres
   CREATE DATABASE ecommerce_db;
   \q
   ```

4. **Run the server:**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

   The server will start on `http://localhost:5000`

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/refresh-token` | Get new access token | No |
| POST | `/api/auth/logout` | Logout user | Yes |
| GET | `/api/auth/me` | Get current user | Yes |

### User Routes (`/api/users`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/users` | Get all users | Yes | Admin |
| GET | `/api/users/:id` | Get user by ID | Yes | Admin |
| PATCH | `/api/users/profile` | Update own profile | Yes | User |
| DELETE | `/api/users/:id` | Delete user | Yes | Admin |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check server status |

## API Usage Examples

### 1. Register a new user

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Access Protected Route

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Refresh Access Token

```bash
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "NEW_ACCESS_TOKEN"
  }
}
```

### 5. Logout

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Database Schema

### Users Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | STRING | User's full name |
| email | STRING | Unique email address |
| password | STRING | Hashed password |
| refreshToken | TEXT | Current refresh token |
| role | ENUM | 'user' or 'admin' |
| isActive | BOOLEAN | Account status |
| lastLogin | DATE | Last login timestamp |
| createdAt | DATE | Account creation date |
| updatedAt | DATE | Last update date |

## Project Structure

```
server/
├── config/
│   ├── database.js          # Sequelize CLI config
│   └── sequelize.js         # Sequelize instance
├── constants/
│   └── messages.js          # Response messages
├── controllers/
│   ├── auth.controller.js   # Auth logic
│   └── user.controller.js   # User management
├── middleware/
│   ├── auth.middleware.js   # JWT verification
│   ├── error.middleware.js  # Error handling
│   └── validation.middleware.js
├── models/
│   ├── index.js
│   └── User.model.js        # User model
├── routes/
│   ├── auth.routes.js       # Auth endpoints
│   ├── user.routes.js       # User endpoints
│   └── index.js             # Route aggregator
├── utils/
│   ├── AppError.js          # Custom error class
│   ├── catchAsync.js        # Async error wrapper
│   └── generateToken.js     # JWT utilities
├── .env.example
├── .sequelizerc
├── package.json
└── server.js                # Entry point
```

## Authentication Flow

### Registration/Login Flow
1. User submits credentials
2. Password is hashed (bcrypt with salt rounds: 10)
3. User record is created/validated
4. Both access token (15min) and refresh token (7d) are generated
5. Refresh token is stored in database
6. Tokens are returned to client

### Protected Route Access
1. Client sends request with access token in Authorization header
2. Middleware verifies token
3. User is attached to request object
4. Route handler processes request

### Token Refresh Flow
1. When access token expires, client sends refresh token
2. Server validates refresh token against database
3. New access token is generated
4. Client continues making requests with new access token

## Error Handling

All errors are handled by the global error middleware:

- **Development**: Full error details with stack trace
- **Production**: Clean error messages without sensitive data
- **Operational Errors**: Trusted errors sent to client
- **Programming Errors**: Generic 500 error sent to client

## Security Features

- ✅ Password hashing with bcrypt (salt rounds: 10)
- ✅ JWT token expiration
- ✅ Refresh token rotation
- ✅ Input validation and sanitization
- ✅ SQL injection protection (via Sequelize)
- ✅ CORS configuration
- ✅ Password not included in JSON responses

## Development

### Running in Development Mode

```bash
npm run dev
```

Uses nodemon for auto-reload on file changes.

### Database Commands

```bash
# Run migrations
npm run db:migrate

# Undo last migration
npm run db:migrate:undo

# Run seeders
npm run db:seed

# Undo all seeders
npm run db:seed:undo

# Reset database (drop, create, migrate, seed)
npm run db:reset
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5432 |
| DB_NAME | Database name | ecommerce_db |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | - |
| JWT_SECRET | Access token secret | - |
| JWT_EXPIRES_IN | Access token expiry | 15m |
| JWT_REFRESH_SECRET | Refresh token secret | - |
| JWT_REFRESH_EXPIRES_IN | Refresh token expiry | 7d |
| CLIENT_URL | Frontend URL | http://localhost:3000 |

## License

ISC
