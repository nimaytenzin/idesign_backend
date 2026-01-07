# Order Module - Frontend Development Guide

This document provides comprehensive guidance for developing the frontend application for the Order Management System. It includes DTOs, API endpoints, workflow guides, and tracking implementation details.

---

## Table of Contents

1. [DTOs (Data Transfer Objects)](#1-dtos-data-transfer-objects)
2. [Data Service (API Endpoints)](#2-data-service-api-endpoints)
3. [Admin Workflow Guide](#3-admin-workflow-guide)
4. [Customer Workflow Guide](#4-customer-workflow-guide)
5. [Order Tracking Implementation](#5-order-tracking-implementation)
6. [Status Enums and Constants](#6-status-enums-and-constants)

---

## 1. DTOs (Data Transfer Objects)

### 1.1 Order Creation DTOs

#### CreateOrderDto
```typescript
interface CreateOrderDto {
  customer: CustomerDetailsDto;
  orderLineItems: CreateOrderLineItemDto[];
  paymentMethod: PaymentMethod; // Required
  shippingCost?: number; // Optional, minimum 0
  internalNotes?: string; // Optional
}
```

#### CustomerDetailsDto
```typescript
interface CustomerDetailsDto {
  name?: string;
  email?: string;
  phoneNumber?: string;
  shippingAddress?: string;
  billingAddress?: string;
}
```

#### CreateOrderLineItemDto
```typescript
interface CreateOrderLineItemDto {
  productId: number; // Required
  quantity: number; // Required, minimum 1
  unitPrice: number; // Required, minimum 0
  discountApplied?: number; // Optional, minimum 0
}
```

### 1.2 Order Update DTOs

#### UpdateOrderDto
```typescript
interface UpdateOrderDto {
  orderLineItems?: CreateOrderLineItemDto[];
  shippingCost?: number;
  internalNotes?: string;
}
```

#### UpdateOrderStatusDto
```typescript
interface UpdateOrderStatusDto {
  fulfillmentStatus?: FulfillmentStatus; // Optional
  paymentStatus?: PaymentStatus; // Optional
  internalNotes?: string; // Optional
}
```

#### UpdateFulfillmentStatusDto
```typescript
interface UpdateFulfillmentStatusDto {
  fulfillmentStatus: FulfillmentStatus; // Required
  internalNotes?: string; // Optional
}
```

#### UpdatePaymentStatusDto
```typescript
interface UpdatePaymentStatusDto {
  paymentStatus: PaymentStatus; // Required
  internalNotes?: string; // Optional
}
```

### 1.3 Payment and Verification DTOs

#### ProcessPaymentDto
```typescript
interface ProcessPaymentDto {
  paymentMethod: PaymentMethod; // Required
  paymentDate?: string; // Optional, ISO date string
  internalNotes?: string; // Optional
}
```

#### VerifyOrderDto
```typescript
interface VerifyOrderDto {
  internalNotes?: string; // Optional
}
```

### 1.4 Query and Response DTOs

#### OrderQueryDto
```typescript
interface OrderQueryDto {
  customerId?: number;
  fulfillmentStatus?: FulfillmentStatus;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}
```

#### TrackOrderDto
```typescript
interface TrackOrderDto {
  orderNumber?: string; // At least one required
  phoneNumber?: string; // At least one required
}
```

#### GetCustomerStatusDto
```typescript
interface GetCustomerStatusDto {
  customerStatusMessage: string;
  fulfillmentStatus: string;
  paymentStatus: string;
  trackingNumber?: string;
}
```

#### MonthQueryDto
```typescript
interface MonthQueryDto {
  year: number; // 1900-2100
  month: number; // 1-12
}
```

### 1.5 Order Response Structure

#### Order Entity (Full Response)
```typescript
interface Order {
  id: number;
  orderNumber: string; // Format: ORD-YYYY-####
  customerId: number;
  orderDate: string; // ISO date string
  totalAmount: number;
  fulfillmentStatus: FulfillmentStatus;
  paymentStatus: PaymentStatus;
  paymentDate?: string; // ISO date string
  paymentMethod?: PaymentMethod;
  receiptGenerated: boolean;
  receiptNumber?: string; // Format: RCP-YYYY-####
  shippingCost: number;
  internalNotes?: string;
  
  // Timestamp fields
  placedAt?: string; // ISO date string
  verifiedAt?: string; // ISO date string
  processingStartedAt?: string; // ISO date string
  packagingStartedAt?: string; // ISO date string
  shippedAt?: string; // ISO date string
  deliveredAt?: string; // ISO date string
  paidAt?: string; // ISO date string
  
  // Relations (when included)
  customer?: Customer;
  orderLineItems?: OrderLineItem[];
  transactions?: Transaction[];
  
  // Customer-facing field (included in GET /orders/:id)
  customerStatusMessage?: string;
}
```

#### OrderLineItem
```typescript
interface OrderLineItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  discountApplied: number;
  lineTotal: number;
  product?: Product; // When included
}
```

#### Customer
```typescript
interface Customer {
  id: number;
  name?: string;
  email?: string;
  phoneNumber?: string;
  shippingAddress?: string;
  billingAddress?: string;
}
```

---

## 2. Data Service (API Endpoints)

### Base URL
```
/api/orders
```

### 2.1 Customer Management Endpoints

#### Create Customer
```http
POST /orders/customers
Content-Type: application/json

Request Body: CreateCustomerDto
Response: Customer (201 Created)
```

#### Get All Customers
```http
GET /orders/customers
Response: Customer[] (200 OK)
```

#### Get Customer by ID
```http
GET /orders/customers/:id
Response: Customer (200 OK)
Error: 404 Not Found if customer doesn't exist
```

#### Update Customer
```http
PATCH /orders/customers/:id
Content-Type: application/json

Request Body: UpdateCustomerDto
Response: Customer (200 OK)
```

#### Delete Customer
```http
DELETE /orders/customers/:id
Response: 200 OK (void)
```

### 2.2 Order Management Endpoints

#### Create Order
```http
POST /orders
Content-Type: application/json

Request Body: CreateOrderDto
Response: Order (201 Created)

Notes:
- Automatically generates orderNumber (ORD-YYYY-####)
- Sets fulfillmentStatus to PLACED
- Sets paymentStatus to PENDING (or PAID for ZPSS)
- Sets placedAt timestamp
- Sends SMS notification to customer
- For ZPSS: Auto-verifies and sets payment to PAID
```

#### Get All Orders
```http
GET /orders?customerId=1&fulfillmentStatus=PLACED&startDate=2024-01-01&endDate=2024-12-31
Response: Order[] (200 OK)

Query Parameters (all optional):
- customerId: number
- fulfillmentStatus: FulfillmentStatus
- startDate: ISO date string
- endDate: ISO date string
```

#### Get Order by ID
```http
GET /orders/:id
Response: Order & { customerStatusMessage: string } (200 OK)

Includes:
- Full order details
- Customer information
- Order line items with products
- Transactions
- customerStatusMessage (customer-friendly status)
```

#### Update Order
```http
PATCH /orders/:id
Content-Type: application/json

Request Body: UpdateOrderDto
Response: Order (200 OK)

Restrictions:
- Cannot update if order is DELIVERED or CANCELED
- Recalculates totalAmount if line items or shipping changed
```

#### Delete Order
```http
DELETE /orders/:id
Response: 200 OK (void)

Restrictions:
- Cannot delete if order is DELIVERED or paymentStatus is PAID
```

### 2.3 Order Status Management Endpoints

#### Update Order Status (Combined)
```http
PATCH /orders/:id/status
Content-Type: application/json

Request Body: UpdateOrderStatusDto
Response: Order (200 OK)

Notes:
- Can update both fulfillmentStatus and paymentStatus
- Validates status transitions
- Sets appropriate timestamps
- Sends SMS notifications on status changes
```

#### Update Fulfillment Status
```http
PATCH /orders/:id/fulfillment-status
Content-Type: application/json

Request Body: UpdateFulfillmentStatusDto
Response: Order (200 OK)

Notes:
- Validates status transitions
- Sets appropriate timestamps (verifiedAt, processingStartedAt, etc.)
- Increments product salesCount when status is DELIVERED
- Sends SMS notification
```

#### Update Payment Status
```http
PATCH /orders/:id/payment-status
Content-Type: application/json

Request Body: UpdatePaymentStatusDto
Response: Order (200 OK)

Notes:
- Sets paidAt timestamp when moving to PAID
- Creates accounting transactions when moving to PAID
- Generates receipt if not already generated
- Sends SMS notification
```

#### Verify Order
```http
POST /orders/:id/verify
Content-Type: application/json

Request Body: VerifyOrderDto
Response: Order (200 OK)

Notes:
- Only works for non-ZPSS payment methods
- Moves paymentStatus from PENDING to PAID
- Sets verifiedAt and paidAt timestamps
- Generates receipt
- Creates accounting transactions
- Sends verification SMS
```

#### Process Payment
```http
POST /orders/:id/payment
Content-Type: application/json

Request Body: ProcessPaymentDto
Response: Order (200 OK)

Restrictions:
- Only works for PLACED or CONFIRMED orders
- Cannot process if already paid

Notes:
- Sets paymentStatus to PAID
- Sets paymentDate and paidAt
- Generates receipt number
- Creates accounting transactions
- Sends SMS notification
```

#### Cancel Order
```http
POST /orders/:id/cancel
Content-Type: application/json

Request Body: { reason?: string }
Response: Order (200 OK)

Notes:
- Sets fulfillmentStatus to CANCELED
- Sets paymentStatus to FAILED
- Creates reversal entries if order was paid
- Sends SMS notification
```

### 2.4 Order Tracking Endpoints

#### Track Order
```http
GET /orders/track?orderNumber=ORD-2024-0001
GET /orders/track?phoneNumber=+97512345678

Query Parameters (at least one required):
- orderNumber: string (returns single order)
- phoneNumber: string (returns all orders for that customer)

Response: Order | Order[] (200 OK)
Error: 404 Not Found if order/customer not found
```

#### Get Order Timeline
```http
GET /orders/:id/timeline
Response: {
  orderId: number;
  orderNumber: string;
  timeline: Array<{
    status: string;
    timestamp: string; // ISO date string
    description: string;
  }>
} (200 OK)

Timeline includes all status changes with timestamps:
- PLACED
- CONFIRMED
- PROCESSING
- PACKAGING
- SHIPPED
- DELIVERED
- PAID
```

#### Get Customer Status
```http
GET /orders/:id/customer-status
Response: GetCustomerStatusDto (200 OK)

Returns customer-friendly status message and tracking information.
```

### 2.5 Reporting Endpoints

#### Get Orders by Month
```http
GET /orders/by-month?year=2024&month=12
Response: OrdersByMonthResponseDto (200 OK)

Query Parameters (required):
- year: number (1900-2100)
- month: number (1-12)

Response Structure:
{
  year: number;
  month: number;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  totalOrders: number;
  orders: Order[];
}
```

#### Get Order Statistics by Month
```http
GET /orders/statistics/by-month?year=2024&month=12
Response: OrderStatisticsByMonthResponseDto (200 OK)

Response Structure:
{
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  totalOrders: number;
  totalRevenue: number;
  totalShippingCost: number;
  averageOrderValue: number;
  ordersByStatus: {
    PLACED: number;
    CONFIRMED: number;
    PROCESSING: number;
    PACKAGING: number;
    SHIPPED: number;
    DELIVERED: number;
    CANCELED: number;
  };
  ordersByPaymentMethod: {
    [PaymentMethod]: number;
  };
  completedOrders: number;
  completedRevenue: number;
  cancelledOrders: number;
  pendingOrders: number;
}
```

#### Get Income Statement
```http
GET /orders/reports/income-statement?startDate=2024-01-01&endDate=2024-12-31
Response: {
  revenue: number;
  expenses: number;
  netIncome: number;
  period: {
    startDate: string | null;
    endDate: string | null;
  };
} (200 OK)
```

#### Get Balance Sheet
```http
GET /orders/reports/balance-sheet
Response: {
  assets: number;
  liabilities: number;
  equity: number;
  total: number;
  balanceCheck: boolean;
} (200 OK)
```

---

## 3. Admin Workflow Guide

### 3.1 Order Lifecycle Overview

The order system uses **dual status tracking**:
- **Fulfillment Status**: Tracks physical order progress
- **Payment Status**: Tracks financial transaction status

### 3.2 Order Creation Workflow

#### Step 1: Create Order
```
POST /orders
Body: CreateOrderDto

Initial State:
- fulfillmentStatus: PLACED
- paymentStatus: PENDING (or PAID for ZPSS)
- placedAt: current timestamp
```

**ZPSS Orders (Auto-Verified):**
- Payment status automatically set to PAID
- verifiedAt and paidAt timestamps set
- Receipt generated immediately
- Accounting transactions created
- SMS sent to customer

**Other Payment Methods:**
- Payment status remains PENDING
- Requires manual verification

### 3.3 Order Verification Workflow

#### For Non-ZPSS Payment Methods

**Step 1: Verify Order**
```
POST /orders/:id/verify
Body: { internalNotes?: string }

Actions:
- Moves paymentStatus: PENDING → PAID
- Sets verifiedAt and paidAt timestamps
- Generates receipt number
- Creates accounting transactions
- Sends verification SMS
```

**Verification Requirements:**
- CASH: Contact customer to confirm commitment
- MBOB, BDB_EPAY, TPAY, BNB_MPAY: Verify payment received

### 3.4 Fulfillment Workflow

#### Status Progression

```
PLACED → CONFIRMED → PROCESSING → PACKAGING → SHIPPED → DELIVERED
```

#### Step 1: Confirm Order
```
PATCH /orders/:id/fulfillment-status
Body: {
  fulfillmentStatus: "CONFIRMED",
  internalNotes?: string
}

Actions:
- Sets verifiedAt timestamp
- Sends SMS notification
```

#### Step 2: Start Processing
```
PATCH /orders/:id/fulfillment-status
Body: {
  fulfillmentStatus: "PROCESSING",
  internalNotes?: string
}

Actions:
- Sets processingStartedAt timestamp
- Sends SMS notification
```

#### Step 3: Start Packaging
```
PATCH /orders/:id/fulfillment-status
Body: {
  fulfillmentStatus: "PACKAGING",
  internalNotes?: string
}

Actions:
- Sets packagingStartedAt timestamp
- Sends SMS notification
```

#### Step 4: Ship Order
```
PATCH /orders/:id/fulfillment-status
Body: {
  fulfillmentStatus: "SHIPPED",
  internalNotes?: string
}

Actions:
- Sets shippedAt timestamp
- Tracking number = orderNumber
- Sends SMS with tracking information
```

#### Step 5: Mark as Delivered
```
PATCH /orders/:id/fulfillment-status
Body: {
  fulfillmentStatus: "DELIVERED",
  internalNotes?: string
}

Actions:
- Sets deliveredAt timestamp
- Increments product salesCount for all items
- Sends delivery SMS
```

### 3.5 Payment Collection Workflow

#### For CASH (COD) Orders

**When Order is Delivered:**
```
PATCH /orders/:id/payment-status
Body: {
  paymentStatus: "PAID",
  internalNotes?: string
}

Actions:
- Sets paidAt timestamp
- Generates receipt if not already generated
- Creates accounting transactions
- Sends payment confirmation SMS
```

**Note:** Staff must manually mark payment as PAID when cash is collected.

### 3.6 Order Cancellation Workflow

```
POST /orders/:id/cancel
Body: { reason?: string }

Actions:
- Sets fulfillmentStatus: CANCELED
- Sets paymentStatus: FAILED
- Creates reversal accounting entries if order was paid
- Sends cancellation SMS
```

### 3.7 Admin Dashboard Features

#### Order List View
- Filter by: customerId, fulfillmentStatus, date range
- Sort by: orderDate (default: newest first)
- Display: orderNumber, customer, status, totalAmount, orderDate

#### Order Detail View
- Full order information
- Customer details
- Order line items with products
- Status timeline
- Payment information
- Accounting transactions
- Internal notes

#### Status Management
- Quick actions for status updates
- Bulk status updates (if needed)
- Status transition validation
- Timestamp display

#### Payment Management
- Payment verification interface
- Payment status updates
- Receipt generation
- Transaction viewing

---

## 4. Customer Workflow Guide

### 4.1 Order Placement

#### Step 1: Customer Places Order
```
POST /orders
Body: CreateOrderDto

Customer provides:
- Customer details (name, email, phone, addresses)
- Order items (products, quantities, prices)
- Payment method
- Shipping cost (if applicable)
```

#### Step 2: Order Confirmation
- Order number generated (ORD-YYYY-####)
- SMS sent to customer with order confirmation
- Order status: PLACED
- Payment status: PENDING (or PAID for ZPSS)

### 4.2 Order Status Messages (Customer-Facing)

The system provides customer-friendly status messages based on order state:

#### Status Message Mapping

| Fulfillment Status | Payment Status | Customer Message |
|-------------------|----------------|------------------|
| PLACED | PENDING | "Awaiting Verification. Your order requires confirmation before processing can begin." |
| CONFIRMED | PENDING | "Order Under Review. We're verifying your payment details." |
| PROCESSING | PAID | "Processing Your Order. We're preparing your items." |
| PACKAGING | PAID | "Ready for Shipment! Your order is being packed and will ship shortly." |
| SHIPPED | PAID | "Out for Delivery! Your order has been shipped. Tracking: [OrderNumber]" |
| SHIPPED | PENDING (CASH) | "Out for Delivery! Tracking: [OrderNumber]. Please prepare exact payment for the courier." |
| DELIVERED | PAID | "Delivered! Your order has been successfully delivered." |
| CANCELED | FAILED | "Order Canceled. The payment or verification failed. Please contact support." |

### 4.3 Order Tracking

#### Public Tracking Interface

**Option 1: Track by Order Number**
```
GET /orders/track?orderNumber=ORD-2024-0001
```

**Option 2: Track by Phone Number**
```
GET /orders/track?phoneNumber=+97512345678
Returns: All orders for that customer
```

#### Tracking Information Display

**Order Timeline View:**
```
GET /orders/:id/timeline

Display chronological status progression:
- PLACED: Order placed
- CONFIRMED: Order confirmed
- PROCESSING: Processing order
- PACKAGING: Packaging started
- SHIPPED: Order shipped
- DELIVERED: Order delivered
- PAID: Payment confirmed
```

**Customer Status View:**
```
GET /orders/:id/customer-status

Returns:
- customerStatusMessage: User-friendly message
- fulfillmentStatus: Current fulfillment status
- paymentStatus: Current payment status
- trackingNumber: Order number (used as tracking)
```

### 4.4 Customer Notifications

#### SMS Notifications

Customers receive SMS notifications for:
1. **Order Confirmation** - When order is created
2. **Order Verified** - When order is verified (non-ZPSS)
3. **Status Changes** - Every fulfillment status change
4. **Payment Confirmed** - When payment status changes to PAID
5. **Order Shipped** - Includes tracking number (orderNumber)
6. **Order Delivered** - Delivery confirmation
7. **Order Canceled** - Cancellation notice

### 4.5 Customer Actions

#### View Order Details
```
GET /orders/:id
Returns: Full order with customerStatusMessage
```

#### Track Order Status
```
GET /orders/track?orderNumber=ORD-2024-0001
GET /orders/:id/customer-status
GET /orders/:id/timeline
```

**Note:** Customers cannot modify orders or change statuses. All updates are admin-only.

---

## 5. Order Tracking Implementation

### 5.1 Tracking Number

**Important:** The tracking number is the **orderNumber** itself.
- Format: `ORD-YYYY-####` (e.g., ORD-2024-0001)
- No separate tracking number field
- Display orderNumber as tracking number to customers

### 5.2 Timeline Data Structure

```typescript
interface OrderTimeline {
  orderId: number;
  orderNumber: string;
  timeline: Array<{
    status: string; // 'PLACED' | 'CONFIRMED' | 'PROCESSING' | 'PACKAGING' | 'SHIPPED' | 'DELIVERED' | 'PAID'
    timestamp: string; // ISO date string
    description: string; // Human-readable description
  }>;
}

// Timeline is sorted chronologically (oldest to newest)
```

### 5.3 Tracking UI Components

#### Recommended UI Elements

1. **Status Progress Bar**
   - Visual representation of order progress
   - Steps: Placed → Confirmed → Processing → Packaging → Shipped → Delivered
   - Highlight current status
   - Show timestamps for each step

2. **Timeline View**
   - Chronological list of all status changes
   - Show date and time for each event
   - Include payment status changes
   - Visual indicators (icons, colors)

3. **Status Message Display**
   - Show customer-friendly message
   - Update in real-time
   - Include tracking number when shipped

4. **Tracking Input**
   - Search by order number
   - Search by phone number
   - Validation and error handling

### 5.4 Tracking Implementation Example

```typescript
// Example: Track order by order number
async trackOrderByNumber(orderNumber: string): Promise<Order> {
  const response = await http.get(`/orders/track?orderNumber=${orderNumber}`);
  return response.data;
}

// Example: Get order timeline
async getOrderTimeline(orderId: number): Promise<OrderTimeline> {
  const response = await http.get(`/orders/${orderId}/timeline`);
  return response.data;
}

// Example: Get customer status
async getCustomerStatus(orderId: number): Promise<GetCustomerStatusDto> {
  const response = await http.get(`/orders/${orderId}/customer-status`);
  return response.data;
}
```

### 5.5 Status Transition Rules

#### Valid Fulfillment Status Transitions

```
PLACED → CONFIRMED → PROCESSING → PACKAGING → SHIPPED → DELIVERED
  ↓         ↓            ↓            ↓          ↓
CANCELED  CANCELED    CANCELED    CANCELED   CANCELED
```

**Rules:**
- Cannot skip statuses
- Cannot go backwards
- CANCELED is terminal (no further transitions)
- DELIVERED is terminal (no further transitions)

#### Payment Status Transitions

```
PENDING → PAID
  ↓
FAILED (on cancellation)
```

**Rules:**
- ZPSS: Auto-transitions to PAID on order creation
- Other methods: Requires verification to move to PAID
- CASH: Can be marked PAID at any time (typically on delivery)
- FAILED: Set when order is canceled

---

## 6. Status Enums and Constants

### 6.1 FulfillmentStatus Enum

```typescript
enum FulfillmentStatus {
  PLACED = 'PLACED',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  PACKAGING = 'PACKAGING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED'
}
```

### 6.2 PaymentStatus Enum

```typescript
enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED'
}
```

### 6.3 PaymentMethod Enum

```typescript
enum PaymentMethod {
  CASH = 'CASH',           // Cash on Delivery (requires verification)
  MBOB = 'MBOB',           // Requires verification
  BDB_EPAY = 'BDB_EPAY',   // Requires verification
  TPAY = 'TPAY',           // Requires verification
  BNB_MPAY = 'BNB_MPAY',   // Requires verification
  ZPSS = 'ZPSS'            // Auto-verified (payment gateway)
}
```

### 6.4 Payment Method Verification Rules

| Payment Method | Requires Verification | Auto-Verified |
|---------------|----------------------|---------------|
| CASH | Yes | No |
| MBOB | Yes | No |
| BDB_EPAY | Yes | No |
| TPAY | Yes | No |
| BNB_MPAY | Yes | No |
| ZPSS | No | Yes |

### 6.5 Status Display Labels (Recommended)

```typescript
const FulfillmentStatusLabels = {
  PLACED: 'Order Placed',
  CONFIRMED: 'Order Confirmed',
  PROCESSING: 'Processing',
  PACKAGING: 'Packaging',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELED: 'Canceled'
};

const PaymentStatusLabels = {
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed'
};

const PaymentMethodLabels = {
  CASH: 'Cash on Delivery',
  MBOB: 'MBOB',
  BDB_EPAY: 'BDB EPay',
  TPAY: 'TPay',
  BNB_MPAY: 'BNB MPay',
  ZPSS: 'ZPSS'
};
```

---

## 7. Error Handling

### 7.1 Common Error Responses

#### 400 Bad Request
- Invalid status transition
- Missing required fields
- Invalid date format
- Invalid enum values

#### 404 Not Found
- Order not found
- Customer not found
- Invalid order ID

#### 409 Conflict
- Order already paid/completed
- Cannot update delivered/canceled orders

### 7.2 Error Response Structure

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
```

---

## 8. Best Practices

### 8.1 Frontend Implementation

1. **Status Management**
   - Always validate status transitions before API calls
   - Show appropriate UI based on current status
   - Disable invalid actions

2. **Real-time Updates**
   - Poll order status for active orders
   - Use WebSocket if available for live updates
   - Refresh timeline data periodically

3. **User Experience**
   - Show customer-friendly messages (use customerStatusMessage)
   - Display timestamps in user's timezone
   - Provide clear status indicators
   - Show tracking number prominently when shipped

4. **Error Handling**
   - Handle network errors gracefully
   - Show user-friendly error messages
   - Retry failed requests where appropriate

5. **Data Validation**
   - Validate DTOs on frontend before submission
   - Show validation errors clearly
   - Prevent invalid status transitions

### 8.2 Admin Interface

1. **Order Management**
   - Bulk operations where possible
   - Quick status update buttons
   - Search and filter capabilities
   - Export functionality

2. **Payment Management**
   - Clear verification workflow
   - Payment method indicators
   - Receipt generation access
   - Transaction viewing

3. **Reporting**
   - Monthly statistics dashboard
   - Revenue tracking
   - Order status distribution
   - Customer order history

---

## 9. API Response Examples

### 9.1 Create Order Response

```json
{
  "id": 1,
  "orderNumber": "ORD-2024-0001",
  "customerId": 1,
  "orderDate": "2024-12-06T08:00:00.000Z",
  "totalAmount": 1500.00,
  "fulfillmentStatus": "PLACED",
  "paymentStatus": "PENDING",
  "paymentMethod": "CASH",
  "shippingCost": 100.00,
  "placedAt": "2024-12-06T08:00:00.000Z",
  "customer": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+97512345678"
  },
  "orderLineItems": [
    {
      "id": 1,
      "productId": 5,
      "quantity": 2,
      "unitPrice": 700.00,
      "discountApplied": 0,
      "lineTotal": 1400.00,
      "product": {
        "id": 5,
        "title": "3D Printed Vase",
        "price": 700.00
      }
    }
  ],
  "customerStatusMessage": "Awaiting Verification. Your order requires confirmation before processing can begin."
}
```

### 9.2 Order Timeline Response

```json
{
  "orderId": 1,
  "orderNumber": "ORD-2024-0001",
  "timeline": [
    {
      "status": "PLACED",
      "timestamp": "2024-12-06T08:00:00.000Z",
      "description": "Order placed"
    },
    {
      "status": "CONFIRMED",
      "timestamp": "2024-12-06T09:00:00.000Z",
      "description": "Order confirmed"
    },
    {
      "status": "PAID",
      "timestamp": "2024-12-06T09:00:00.000Z",
      "description": "Payment confirmed"
    },
    {
      "status": "PROCESSING",
      "timestamp": "2024-12-06T10:00:00.000Z",
      "description": "Processing order"
    }
  ]
}
```

### 9.3 Customer Status Response

```json
{
  "customerStatusMessage": "Processing Your Order. We're preparing your items.",
  "fulfillmentStatus": "PROCESSING",
  "paymentStatus": "PAID",
  "trackingNumber": "ORD-2024-0001"
}
```

---

## 10. Integration Notes

### 10.1 SMS Notifications

- SMS notifications are sent automatically by the backend
- No frontend action required
- Messages are formatted by the backend
- Customer phone number must be provided

### 10.2 Accounting Integration

- Transactions are created automatically when payment status moves to PAID
- No frontend action required
- Transactions are visible via `/orders/transactions` endpoint
- Double-entry bookkeeping is handled by backend

### 10.3 Product Sales Count

- Product salesCount is incremented automatically when order is DELIVERED
- No frontend action required
- Increment is based on order line item quantities

---

## End of Documentation

This guide provides all necessary information for implementing the frontend order management system. For additional details, refer to the backend API documentation or contact the development team.

