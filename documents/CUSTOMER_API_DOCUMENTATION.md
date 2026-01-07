# Customer API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Endpoints](#endpoints)
4. [Data Models](#data-models)
5. [Error Responses](#error-responses)
6. [Examples](#examples)

---

## Overview

The Customer API provides endpoints for managing customer information in the system. Customers are automatically created or found when orders are placed, and can also be managed directly through these endpoints.

### Key Features
- Create, read, update, and delete customers
- Automatic customer lookup by email or phone number
- Support for shipping and billing addresses
- Integration with order system

---

## Base URL

```
/api/customers
```

All endpoints are prefixed with `/customers`.

---

## Endpoints

### 1. Create Customer

Create a new customer in the system.

**Endpoint:** `POST /customers`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+975-17123456",
  "shippingAddress": "123 Main Street, Thimphu, Bhutan",
  "billingAddress": "123 Main Street, Thimphu, Bhutan"
}
```

**Request Body Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No* | Customer's full name |
| `email` | string | No* | Customer's email address (must be valid email format) |
| `phoneNumber` | string | No | Customer's phone number |
| `shippingAddress` | string | No | Shipping address |
| `billingAddress` | string | No | Billing address |

*Note: At least `name` or `email` must be provided.

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+975-17123456",
  "shippingAddress": "123 Main Street, Thimphu, Bhutan",
  "billingAddress": "123 Main Street, Thimphu, Bhutan",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - If neither name nor email is provided
  ```json
  {
    "statusCode": 400,
    "message": "Customer must have at least a name or email",
    "error": "Bad Request"
  }
  ```

- `400 Bad Request` - If email format is invalid
  ```json
  {
    "statusCode": 400,
    "message": ["email must be an email"],
    "error": "Bad Request"
  }
  ```

---

### 2. Get All Customers

Retrieve a list of all customers, ordered alphabetically by name.

**Endpoint:** `GET /customers`

**Query Parameters:** None

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Alice Smith",
    "email": "alice@example.com",
    "phoneNumber": "+975-17111111",
    "shippingAddress": "456 Park Avenue",
    "billingAddress": "456 Park Avenue",
    "createdAt": "2024-01-10T08:00:00.000Z",
    "updatedAt": "2024-01-10T08:00:00.000Z"
  },
  {
    "id": 2,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+975-17123456",
    "shippingAddress": "123 Main Street, Thimphu, Bhutan",
    "billingAddress": "123 Main Street, Thimphu, Bhutan",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

**Response Schema:**
- Returns an array of Customer objects
- Customers are sorted by name in ascending order (A-Z)

---

### 3. Get Customer by ID

Retrieve a specific customer by their ID.

**Endpoint:** `GET /customers/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Customer ID (must be a positive integer) |

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+975-17123456",
  "shippingAddress": "123 Main Street, Thimphu, Bhutan",
  "billingAddress": "123 Main Street, Thimphu, Bhutan",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - If customer with the given ID doesn't exist
  ```json
  {
    "statusCode": 404,
    "message": "Customer not found",
    "error": "Not Found"
  }
  ```

- `400 Bad Request` - If ID is invalid (not a number)
  ```json
  {
    "statusCode": 400,
    "message": "Invalid customer ID: abc. Customer ID must be a positive number.",
    "error": "Bad Request"
  }
  ```

---

### 4. Update Customer

Update an existing customer's information.

**Endpoint:** `PATCH /customers/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Customer ID (must be a positive integer) |

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "phoneNumber": "+975-17999999",
  "shippingAddress": "789 New Street, Paro, Bhutan"
}
```

**Request Body Schema:**
All fields are optional. Only include fields you want to update.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Customer's full name |
| `email` | string | No | Customer's email address (must be valid email format) |
| `phoneNumber` | string | No | Customer's phone number |
| `shippingAddress` | string | No | Shipping address |
| `billingAddress` | string | No | Billing address |

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "John Doe Updated",
  "email": "john.doe@example.com",
  "phoneNumber": "+975-17999999",
  "shippingAddress": "789 New Street, Paro, Bhutan",
  "billingAddress": "123 Main Street, Thimphu, Bhutan",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:45:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - If customer with the given ID doesn't exist
  ```json
  {
    "statusCode": 404,
    "message": "Customer not found",
    "error": "Not Found"
  }
  ```

- `400 Bad Request` - If email format is invalid
  ```json
  {
    "statusCode": 400,
    "message": ["email must be an email"],
    "error": "Bad Request"
  }
  ```

---

### 5. Delete Customer

Delete a customer from the system.

**Endpoint:** `DELETE /customers/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Customer ID (must be a positive integer) |

**Response:** `200 OK`
```json
{
  "message": "Customer deleted successfully"
}
```

**Note:** The response body may be empty. A 200 status code indicates successful deletion.

**Error Responses:**
- `404 Not Found` - If customer with the given ID doesn't exist
  ```json
  {
    "statusCode": 404,
    "message": "Customer not found",
    "error": "Not Found"
  }
  ```

**Important:** Deleting a customer may fail if there are associated orders. Ensure proper cascade handling in the database.

---

## Data Models

### Customer Entity

```typescript
{
  id: number;                    // Auto-incremented primary key
  name: string | null;            // Customer's full name
  email: string | null;           // Unique email address
  phoneNumber: string | null;     // Phone number
  shippingAddress: string | null; // Shipping address
  billingAddress: string | null;  // Billing address
  createdAt: Date;                // Creation timestamp
  updatedAt: Date;                // Last update timestamp
  orders: Order[];                 // Associated orders (when included)
}
```

### CreateCustomerDto

```typescript
{
  name?: string;
  email?: string;
  phoneNumber?: string;
  shippingAddress?: string;
  billingAddress?: string;
}
```

**Validation Rules:**
- At least `name` or `email` must be provided
- `email` must be a valid email format if provided
- All fields are optional, but at least one identifier (name or email) is required

### UpdateCustomerDto

```typescript
{
  name?: string;
  email?: string;
  phoneNumber?: string;
  shippingAddress?: string;
  billingAddress?: string;
}
```

**Validation Rules:**
- All fields are optional
- `email` must be a valid email format if provided
- Only provided fields will be updated

### CustomerDetailsDto

Used internally by the order service for finding or creating customers.

```typescript
{
  name?: string;
  email?: string;
  phoneNumber?: string;
  shippingAddress?: string;
  billingAddress?: string;
}
```

---

## Error Responses

### Standard Error Format

All error responses follow this structure:

```json
{
  "statusCode": number,
  "message": string | string[],
  "error": string
}
```

### Common Error Codes

| Status Code | Description | Common Causes |
|-------------|-------------|---------------|
| `400` | Bad Request | Invalid input data, validation errors |
| `404` | Not Found | Customer ID doesn't exist |
| `500` | Internal Server Error | Server-side errors |

---

## Examples

### Example 1: Create a Customer

**Request:**
```bash
curl -X POST http://localhost:3000/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "phoneNumber": "+975-17234567",
    "shippingAddress": "456 Oak Avenue, Thimphu",
    "billingAddress": "456 Oak Avenue, Thimphu"
  }'
```

**Response:**
```json
{
  "id": 3,
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "phoneNumber": "+975-17234567",
  "shippingAddress": "456 Oak Avenue, Thimphu",
  "billingAddress": "456 Oak Avenue, Thimphu",
  "createdAt": "2024-01-20T14:30:00.000Z",
  "updatedAt": "2024-01-20T14:30:00.000Z"
}
```

### Example 2: Get All Customers

**Request:**
```bash
curl -X GET http://localhost:3000/customers
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Alice Smith",
    "email": "alice@example.com",
    "phoneNumber": "+975-17111111",
    "shippingAddress": "456 Park Avenue",
    "billingAddress": "456 Park Avenue",
    "createdAt": "2024-01-10T08:00:00.000Z",
    "updatedAt": "2024-01-10T08:00:00.000Z"
  },
  {
    "id": 2,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+975-17123456",
    "shippingAddress": "123 Main Street, Thimphu, Bhutan",
    "billingAddress": "123 Main Street, Thimphu, Bhutan",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### Example 3: Get Customer by ID

**Request:**
```bash
curl -X GET http://localhost:3000/customers/1
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+975-17123456",
  "shippingAddress": "123 Main Street, Thimphu, Bhutan",
  "billingAddress": "123 Main Street, Thimphu, Bhutan",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Example 4: Update Customer

**Request:**
```bash
curl -X PATCH http://localhost:3000/customers/1 \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+975-17999999",
    "shippingAddress": "789 New Street, Paro, Bhutan"
  }'
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+975-17999999",
  "shippingAddress": "789 New Street, Paro, Bhutan",
  "billingAddress": "123 Main Street, Thimphu, Bhutan",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-20T15:00:00.000Z"
}
```

### Example 5: Delete Customer

**Request:**
```bash
curl -X DELETE http://localhost:3000/customers/1
```

**Response:**
```
200 OK (empty body or success message)
```

---

## Internal Service Methods

The CustomerService also provides internal methods used by other modules:

### findOrCreateCustomer

**Used by:** OrderService when creating orders

**Method Signature:**
```typescript
findOrCreateCustomer(customerDetails: CustomerDetailsDto): Promise<Customer>
```

**Behavior:**
1. First tries to find customer by email (if provided)
2. If not found, tries to find by phone number (if provided)
3. If found, updates customer with any new information provided
4. If not found, creates a new customer
5. Requires at least `name` or `email` for new customers

**Example Usage:**
```typescript
const customer = await customerService.findOrCreateCustomer({
  name: "John Doe",
  email: "john@example.com",
  phoneNumber: "+975-17123456"
});
```

### findCustomerByPhoneNumber

**Used by:** OrderService for order tracking

**Method Signature:**
```typescript
findCustomerByPhoneNumber(phoneNumber: string): Promise<Customer | null>
```

**Behavior:**
- Searches for customer by exact phone number match
- Returns `null` if not found
- Used for order tracking by phone number

---

## Integration with Order System

Customers are automatically managed when orders are created:

1. **Order Creation Flow:**
   - When an order is created, `CustomerService.findOrCreateCustomer()` is called
   - Customer is found by email or phone number
   - If found, customer information is updated with any new details
   - If not found, a new customer is created
   - The customer ID is then associated with the order

2. **Customer Lookup Priority:**
   - Primary: Email address (if provided)
   - Secondary: Phone number (if email not found)
   - Fallback: Create new customer

3. **Data Updates:**
   - When an existing customer is found during order creation, their information is updated with any new details provided in the order
   - This ensures customer records stay current

---

## Notes

1. **Email Uniqueness:** Email addresses must be unique across all customers. Attempting to create a customer with an existing email will result in a database constraint error.

2. **Required Fields:** At least `name` or `email` must be provided when creating a customer.

3. **Phone Number Format:** Phone numbers are stored as strings and can be in any format. No validation is performed on phone number format.

4. **Address Fields:** Both shipping and billing addresses are stored as text fields and can contain any address information.

5. **Order Association:** Customers can have multiple orders. The `orders` relationship is available when including related data.

6. **Deletion Considerations:** Be cautious when deleting customers that have associated orders, as this may cause referential integrity issues depending on database constraints.

---

## Testing

### Using cURL

All examples above use cURL commands that can be run directly in a terminal.

### Using Postman

1. Import the endpoints into Postman
2. Set base URL: `http://localhost:3000`
3. Use the request examples above as templates

### Using JavaScript/TypeScript

```typescript
// Create customer
const response = await fetch('http://localhost:3000/customers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    phoneNumber: '+975-17123456'
  })
});
const customer = await response.json();

// Get all customers
const customers = await fetch('http://localhost:3000/customers')
  .then(res => res.json());

// Get customer by ID
const customer = await fetch('http://localhost:3000/customers/1')
  .then(res => res.json());

// Update customer
const updated = await fetch('http://localhost:3000/customers/1', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phoneNumber: '+975-17999999' })
}).then(res => res.json());

// Delete customer
await fetch('http://localhost:3000/customers/1', {
  method: 'DELETE'
});
```

---

## Changelog

### Version 1.0
- Initial API documentation
- Support for CRUD operations
- Integration with order system
- Automatic customer lookup and creation

