# Shipping Address API Documentation

## Overview
The Shipping Address API allows users to manage their delivery addresses for orders.

## Base URL
`/api/shipping-addresses`

## Authentication
All endpoints require authentication. Include the JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Get All Shipping Addresses
**GET** `/api/shipping-addresses`

Retrieve all shipping addresses for the authenticated user.

#### Request
```bash
curl -X GET http://localhost:5000/api/shipping-addresses \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "addresses": [
      {
        "id": "uuid",
        "userId": "uuid",
        "fullName": "John Doe",
        "phoneNumber": "9876543210",
        "email": "john@example.com",
        "addressLine1": "123 Main Street",
        "addressLine2": "Apt 4B",
        "city": "New York",
        "state": "NY",
        "postalCode": "10001",
        "country": "India",
        "isDefault": true,
        "addressType": "home",
        "createdAt": "2026-03-24T10:00:00Z",
        "updatedAt": "2026-03-24T10:00:00Z"
      }
    ],
    "total": 1
  }
}
```

#### Error Responses
- **401**: Unauthorized

---

### 2. Get Single Shipping Address
**GET** `/api/shipping-addresses/:addressId`

Retrieve a specific shipping address by ID.

#### Request Parameters
- `addressId` (UUID): The ID of the address to retrieve

#### Request
```bash
curl -X GET http://localhost:5000/api/shipping-addresses/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "address": {
      "id": "uuid",
      "userId": "uuid",
      "fullName": "John Doe",
      "phoneNumber": "9876543210",
      "email": "john@example.com",
      "addressLine1": "123 Main Street",
      "addressLine2": "Apt 4B",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "India",
      "isDefault": true,
      "addressType": "home",
      "createdAt": "2026-03-24T10:00:00Z",
      "updatedAt": "2026-03-24T10:00:00Z"
    }
  }
}
```

#### Error Responses
- **401**: Unauthorized
- **403**: Unauthorized access to this address
- **404**: Shipping address not found

---

### 3. Create Shipping Address
**POST** `/api/shipping-addresses`

Create a new shipping address for the user.

#### Request Body
```json
{
  "fullName": "John Doe",
  "phoneNumber": "9876543210",
  "email": "john@example.com",
  "addressLine1": "123 Main Street",
  "addressLine2": "Apt 4B",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "India (optional, default)",
  "isDefault": false,
  "addressType": "home"
}
```

#### Request
```bash
curl -X POST http://localhost:5000/api/shipping-addresses \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "phoneNumber": "9876543210",
    "email": "john@example.com",
    "addressLine1": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "addressType": "home"
  }'
```

#### Response (201 Created)
```json
{
  "status": "success",
  "message": "Shipping address created successfully",
  "data": {
    "address": {
      "id": "uuid",
      "userId": "uuid",
      "fullName": "John Doe",
      "phoneNumber": "9876543210",
      "email": "john@example.com",
      "addressLine1": "123 Main Street",
      "addressLine2": "Apt 4B",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "India",
      "isDefault": false,
      "addressType": "home",
      "createdAt": "2026-03-24T10:00:00Z",
      "updatedAt": "2026-03-24T10:00:00Z"
    }
  }
}
```

#### Error Responses
- **400**:
  - `All required fields must be provided`
  - `Invalid phone number format`
  - `Invalid email format`
  - `Postal code must be between 4 and 10 characters`
  - `Full name must be between 2 and 100 characters`
- **401**: Unauthorized

---

### 4. Update Shipping Address
**PUT** `/api/shipping-addresses/:addressId`

Update an existing shipping address (partial updates supported).

#### Request Parameters
- `addressId` (UUID): The ID of the address to update

#### Request Body (all fields optional)
```json
{
  "fullName": "Jane Doe",
  "phoneNumber": "9876543211",
  "email": "jane@example.com",
  "city": "Los Angeles",
  "state": "CA",
  "postalCode": "90001",
  "isDefault": true,
  "addressType": "office"
}
```

#### Request
```bash
curl -X PUT http://localhost:5000/api/shipping-addresses/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Los Angeles",
    "state": "CA"
  }'
```

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "Shipping address updated successfully",
  "data": {
    "address": {...}
  }
}
```

#### Error Responses
- **400**: Invalid field values
- **401**: Unauthorized
- **403**: Unauthorized access to this address
- **404**: Shipping address not found

---

### 5. Set Address as Default
**PATCH** `/api/shipping-addresses/:addressId/set-default`

Set a specific address as the user's default shipping address.

#### Request Parameters
- `addressId` (UUID): The ID of the address to set as default

#### Request
```bash
curl -X PATCH http://localhost:5000/api/shipping-addresses/550e8400-e29b-41d4-a716-446655440000/set-default \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "Address set as default successfully",
  "data": {
    "address": {
      "id": "uuid",
      "isDefault": true,
      ...
    }
  }
}
```

#### Error Responses
- **401**: Unauthorized
- **403**: Unauthorized access to this address
- **404**: Shipping address not found

---

### 6. Delete Shipping Address
**DELETE** `/api/shipping-addresses/:addressId`

Delete a shipping address.

#### Request Parameters
- `addressId` (UUID): The ID of the address to delete

#### Request
```bash
curl -X DELETE http://localhost:5000/api/shipping-addresses/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "Shipping address deleted successfully"
}
```

#### Error Responses
- **400**: `Cannot delete address that is used in active orders`
- **401**: Unauthorized
- **403**: Unauthorized access to this address
- **404**: Shipping address not found

---

## Validation Rules

### fullName
- Required
- Length: 2-100 characters
- Alphanumeric and special characters allowed

### phoneNumber
- Required
- Length: 10-15 characters
- Format: Digits, spaces, dashes, plus, parentheses allowed

### email
- Required
- Must be valid email format
- Auto-normalized to lowercase

### addressLine1
- Required
- Length: 5-100 characters

### addressLine2
- Optional
- Length: 0-100 characters

### city
- Required
- Length: 2-50 characters

### state
- Required
- Length: 2-50 characters

### postalCode
- Required
- Length: 4-10 characters

### country
- Optional (defaults to "India")
- Length: 2-50 characters

### addressType
- Optional (defaults to "home")
- Valid values: `home`, `office`, `other`

### isDefault
- Optional (defaults to false)
- Only one address per user can be default

---

## Edge Cases Handled

### Default Address Management
- ✓ When setting a new default, previous default is automatically unset
- ✓ If default address is deleted, another address becomes default
- ✓ Prevents having no default address when alternatives exist

### Active Order Protection
- ✓ Cannot delete an address that's being used in active orders
- ✓ Allows deletion of addresses used in completed/cancelled orders

### Validation
- ✓ Phone number format validation
- ✓ Email format validation
- ✓ Postal code length validation
- ✓ Field length validations
- ✓ Required field checks

### User Authorization
- ✓ Users can only access/modify their own addresses
- ✓ Prevents cross-user address access

### Data Consistency
- ✓ Automatically normalizes email to lowercase
- ✓ Trims whitespace from input fields
- ✓ Maintains address type consistency

---

## Data Types

### ShippingAddress Object
```json
{
  "id": "UUID",
  "userId": "UUID",
  "fullName": "String (2-100)",
  "phoneNumber": "String (10-15)",
  "email": "String (Email)",
  "addressLine1": "String (5-100)",
  "addressLine2": "String (0-100, nullable)",
  "city": "String (2-50)",
  "state": "String (2-50)",
  "postalCode": "String (4-10)",
  "country": "String (2-50)",
  "isDefault": "Boolean",
  "addressType": "Enum(home, office, other)",
  "createdAt": "ISO 8601 DateTime",
  "updatedAt": "ISO 8601 DateTime"
}
```

---

## Examples

### Create Multiple Addresses
```bash
# Home address
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
    "addressType": "home",
    "isDefault": true
  }'

# Office address
curl -X POST http://localhost:5000/api/shipping-addresses \
  -H "Authorization: Bearer <token>" \
  -d '{
    "fullName": "John Doe",
    "phoneNumber": "9876543210",
    "email": "john@work.com",
    "addressLine1": "456 Business Ave",
    "city": "New York",
    "state": "NY",
    "postalCode": "10002",
    "addressType": "office"
  }'
```

### Switch Default Address
```bash
curl -X PATCH http://localhost:5000/api/shipping-addresses/office-address-id/set-default \
  -H "Authorization: Bearer <token>"
```
