# Order Placement Workflow - Services and Data Flow

## Table of Contents
1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Service Components](#service-components)
4. [Order Placement Flow](#order-placement-flow)
5. [Data Flow](#data-flow)
6. [Integration Points](#integration-points)
7. [Event Sourcing & Timeline](#event-sourcing--timeline)
8. [SMS Notification Flow](#sms-notification-flow)
9. [Discount Calculation Flow](#discount-calculation-flow)
10. [Error Handling](#error-handling)

---

## Overview

The order placement system is a comprehensive e-commerce order management system built with NestJS, using Sequelize ORM and MySQL. It implements event sourcing for order history tracking, outbox pattern for reliable messaging, and template-based SMS notifications.

### Key Features
- **Event Sourcing**: Complete order history via timeline events
- **Outbox Pattern**: Reliable asynchronous SMS delivery
- **Discount System**: Multi-level discount calculation (product, category, order-level)
- **Template-based SMS**: Configurable SMS templates with variable rendering
- **Transaction Safety**: Database transactions ensure data consistency
- **Customer Management**: Automatic customer creation/lookup

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend/Client                          │
└────────────────────────────┬────────────────────────────────────┘
                              │ HTTP POST /orders
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OrderController                               │
│  - POST /orders (createOrder)                                    │
│  - Extracts referrer from headers                                │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OrderService                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ createOrder() - Main orchestration method                 │  │
│  │ 1. Start Database Transaction                             │  │
│  │ 2. Customer Management                                    │  │
│  │ 3. Product Validation                                      │  │
│  │ 4. Discount Calculation                                    │  │
│  │ 5. Order Creation                                          │  │
│  │ 6. Timeline Events                                         │  │
│  │ 7. SMS Trigger (async)                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────┬──────────────┬──────────────┬──────────────┬──────────────┘
      │              │              │              │
      ▼              ▼              ▼              ▼
┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────────┐
│Customer  │  │DiscountCalc │  │Product   │  │OrderTimeline │
│Service   │  │Service       │  │Model     │  │Service       │
└──────────┘  └──────────────┘  └──────────┘  └──────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SmsTriggerService                             │
│  - Finds active SMS templates                                   │
│  - Renders messages with order data                             │
│  - Creates Outbox entries                                       │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OutboxService                                 │
│  - Stores SMS tasks                                              │
│  - Manages retry logic                                           │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              OutboxProcessorService (Cron: Every 30s)           │
│  - Processes pending outbox tasks                                │
│  - Sends SMS via SmsService                                      │
│  - Updates timeline with communication events                    │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SmsService (External)                         │
│  - Actual SMS delivery                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Service Components

### 1. OrderController
**Location**: `src/modules/order/order.controller.ts`

**Responsibilities**:
- HTTP endpoint handling
- Request validation
- Referrer extraction from headers
- Response formatting

**Key Method**:
```typescript
@Post()
async createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto): Promise<Order>
```

### 2. OrderService
**Location**: `src/modules/order/order.service.ts`

**Responsibilities**:
- Order creation orchestration
- Transaction management
- Business logic validation
- Order number generation
- Status management

**Dependencies**:
- `CustomerService` - Customer management
- `DiscountCalculationService` - Discount computation
- `SmsTriggerService` - SMS notification triggering
- `AccountsService` - Accounting entries (post-payment)

### 3. CustomerService
**Location**: `src/modules/customer/customer.service.ts`

**Responsibilities**:
- Find or create customer by email/phone/name
- Customer data validation

**Method Used**:
```typescript
findOrCreateCustomer(customerDetails: CustomerDetailsDto): Promise<Customer>
```

### 4. DiscountCalculationService
**Location**: `src/modules/discount/services/discount-calculation.service.ts`

**Responsibilities**:
- Calculate line item discounts
- Calculate order-level discounts
- Apply voucher codes
- Handle discount priority
- Quantity threshold discounts

**Key Method**:
```typescript
calculateOrderDiscounts(
  orderLineItems: Array<{productId, quantity, unitPrice}>,
  voucherCode?: string
): Promise<DiscountCalculationResult>
```

**Discount Types Supported**:
- `FLAT_ALL_PRODUCTS` - Apply to all products
- `FLAT_SELECTED_PRODUCTS` - Apply to specific products
- `FLAT_SELECTED_CATEGORIES` - Apply to product categories

**Discount Scopes**:
- `LINE_ITEM` - Applied per product
- `ORDER_TOTAL` - Applied to entire order

### 5. SmsTriggerService
**Location**: `src/modules/sms-template/services/sms-trigger.service.ts`

**Responsibilities**:
- Find active SMS templates for trigger events
- Render template messages with order data
- Create outbox entries for scheduled SMS delivery
- Handle template priority and send counts

**Key Method**:
```typescript
processSmsTemplates(
  order: Order,
  triggerEvent: SmsTriggerEvent,
  additionalData?: any
): Promise<void>
```

**Trigger Events**:
- `ORDER_PLACED` - When order is first created
- `COUNTER_PAYMENT_RECEIPT` - For counter orders with payment
- `PLACED_TO_CONFIRMED` - Payment verified
- `CONFIRMED_TO_PROCESSING` - Order processing started
- `PROCESSING_TO_PACKAGING` - Packaging started
- `PACKAGING_TO_SHIPPED` - Order shipped
- `SHIPPED_TO_DELIVERED` - Order delivered
- `ORDER_CANCELED` - Order canceled
- `PAYMENT_FAILED` - Payment failed

### 6. OutboxService
**Location**: `src/modules/order/services/outbox.service.ts`

**Responsibilities**:
- Create outbox entries for async tasks
- Retrieve pending tasks
- Update task status
- Manage retry scheduling

**Key Methods**:
```typescript
addOutboxEvent(orderId, eventType, payload, scheduledFor): Promise<Outbox>
getPendingTasks(limit): Promise<Outbox[]>
updateTaskStatus(taskId, status, errorMessage?): Promise<void>
incrementRetryAndReschedule(taskId, delayMs): Promise<void>
```

### 7. OutboxProcessorService
**Location**: `src/modules/order/services/outbox-processor.service.ts`

**Responsibilities**:
- Process outbox tasks via cron job (every 30 seconds)
- Send SMS messages
- Handle task failures and retries
- Add communication events to timeline

**Cron Schedule**: `@Cron(CronExpression.EVERY_30_SECONDS)`

**Retry Logic**:
- Max retries: 3
- Retry delay: 60 seconds (exponential backoff)
- Failed tasks marked as `FAILED` after max retries

### 8. OrderTimelineService
**Location**: `src/modules/order/services/order-timeline.service.ts`

**Responsibilities**:
- Add timeline events (event sourcing)
- Retrieve order history
- Query events by type and time range

**Event Types**:
- `FULFILLMENT` - Order status changes
- `PAYMENT` - Payment status changes
- `COMMUNICATION` - SMS/Email sent events

---

## Order Placement Flow

### Step-by-Step Process

#### 1. Request Reception
```
Client → POST /orders
Body: CreateOrderDto {
  customer: CustomerDetailsDto,
  orderLineItems: CreateOrderLineItemDto[],
  orderType?: OrderType,
  paymentMethod?: PaymentMethod,
  voucherCode?: string,
  shippingCost?: number,
  ...
}
```

#### 2. Controller Processing
- Extract referrer from request headers (if not in DTO)
- Validate DTO structure
- Call `orderService.createOrder()`

#### 3. Transaction Start
```typescript
return this.sequelize.transaction(async (transaction) => {
  // All operations within this transaction
});
```

#### 4. Customer Management
```typescript
const customer = await this.customerService.findOrCreateCustomer(
  createOrderDto.customer
);
```
- Searches by email, phone, or name
- Creates new customer if not found
- Returns existing customer if found

#### 5. Order Validation
- **Line Items Check**: At least one line item required
- **Product Validation**:
  - Product must exist
  - Product must be available (`isAvailable = true`)
  - Validates within transaction

#### 6. Discount Calculation
```typescript
const discountResult = await this.discountCalculationService.calculateOrderDiscounts(
  orderLineItemsForCalculation,
  createOrderDto.voucherCode
);
```

**Process**:
1. Calculate subtotal before discounts
2. Load active discounts
3. Filter by voucher code (if provided)
4. Filter by minimum order value
5. Filter by usage limits
6. Sort by priority
7. Apply discounts in priority order
8. Apply quantity threshold discounts
9. Return discount breakdown

**Result Structure**:
```typescript
{
  orderDiscount: number,
  lineItemDiscounts: LineItemDiscount[],
  appliedDiscounts: Discount[],
  discountBreakdown: string,
  subtotalBeforeDiscount: number,
  subtotalAfterDiscount: number,
  finalTotal: number
}
```

#### 7. Price Calculation
```typescript
// Apply discounts to line items
lineItemsWithDiscounts = orderLineItems.map(item => {
  discountApplied = calculatedDiscount || item.discountApplied || 0;
  lineTotal = (quantity * unitPrice) - discountApplied;
  return { ...item, discountApplied, lineTotal };
});

// Calculate totals
subtotal = sum(lineItemsWithDiscounts.lineTotal);
orderDiscount = discountResult.orderDiscount || createOrderDto.orderDiscount || 0;
shippingCost = createOrderDto.shippingCost || 0;
totalAmount = subtotal - orderDiscount + shippingCost;
```

#### 8. Order Number Generation
```typescript
const orderNumber = await this.generateOrderNumberInTransaction(transaction);
// Format: ORD-{YEAR}-{SEQUENCE}
// Example: ORD-2024-0001
```

**Process**:
- Finds last order number for current year
- Increments sequence
- Pads to 4 digits

#### 9. Order Type & Payment Status Determination
```typescript
const orderType = createOrderDto.orderType || OrderType.ONLINE;
const paymentStatus = 
  (orderType === OrderType.COUNTER && createOrderDto.paymentMethod)
    ? PaymentStatus.PAID
    : PaymentStatus.PENDING;
```

**Logic**:
- **COUNTER orders** with payment method → `PAID`
- **ONLINE orders** → `PENDING` (requires verification)

#### 10. Order Creation
```typescript
const order = await this.orderModel.create({
  customerId: customer.id,
  orderNumber,
  orderDate: new Date(),
  orderType,
  totalAmount,
  orderDiscount,
  voucherCode: createOrderDto.voucherCode,
  fulfillmentStatus: FulfillmentStatus.PLACED,
  paymentStatus,
  paymentMethod: createOrderDto.paymentMethod || null,
  shippingCost,
  internalNotes: createOrderDto.internalNotes,
  referrerSource: createOrderDto.referrerSource || null,
  paidAt: paymentStatus === PaymentStatus.PAID ? new Date() : null,
  lastUpdated: new Date(),
}, { transaction });
```

#### 11. Order Line Items Creation
```typescript
for (const lineItem of lineItemsWithDiscounts) {
  await this.orderLineItemModel.create({
    orderId: order.id,
    productId: lineItem.productId,
    quantity: lineItem.quantity,
    unitPrice: lineItem.unitPrice,
    discountApplied: lineItem.discountApplied,
    lineTotal: lineItem.lineTotal,
  }, { transaction });
}
```

#### 12. Timeline Events (Event Sourcing)
```typescript
// Fulfillment Event
await this.timelineModel.create({
  orderId: order.id,
  statusType: StatusType.FULFILLMENT,
  eventValue: FulfillmentStatus.PLACED,
  metadata: { orderType },
  idempotencyKey: null,
  eventVersion: '1.0',
}, { transaction });

// Payment Event
await this.timelineModel.create({
  orderId: order.id,
  statusType: StatusType.PAYMENT,
  eventValue: paymentStatus,
  metadata: {
    paymentMethod: createOrderDto.paymentMethod,
    amount: totalAmount,
  },
  idempotencyKey: null,
  eventVersion: '1.0',
}, { transaction });
```

#### 13. Order Reload with Relations
```typescript
const savedOrder = await this.orderModel.findByPk(order.id, {
  include: [
    { model: Customer, as: 'customer' },
    { model: OrderLineItem, as: 'orderLineItems' },
  ],
  transaction,
});
```

#### 14. SMS Notification Trigger (Async)
```typescript
const triggerEvent = 
  orderType === OrderType.COUNTER
    ? SmsTriggerEvent.COUNTER_PAYMENT_RECEIPT
    : SmsTriggerEvent.ORDER_PLACED;

this.smsTriggerService
  .processSmsTemplates(savedOrder, triggerEvent)
  .then(() => { /* success log */ })
  .catch((error) => { /* error log */ });
```

**Note**: This is fire-and-forget, doesn't block transaction commit.

#### 15. Transaction Commit
- All database changes committed atomically
- If any step fails, entire transaction rolls back

#### 16. Return Order
- Returns complete order with customer and line items
- SMS processing continues asynchronously

---

## Data Flow

### Request Data Structure

```typescript
CreateOrderDto {
  customer: {
    name: string,
    email?: string,
    phoneNumber?: string,
    address?: string
  },
  orderLineItems: [{
    productId: number,
    quantity: number,
    unitPrice: number,
    discountApplied?: number
  }],
  orderType?: 'ONLINE' | 'COUNTER',
  paymentMethod?: 'CASH' | 'MBOB' | 'BDB_EPAY' | 'TPAY' | 'BNB_MPAY' | 'ZPSS',
  voucherCode?: string,
  shippingCost?: number,
  internalNotes?: string,
  referrerSource?: string
}
```

### Database Entities Created

1. **Order** (if customer is new)
   - Customer record created
   - Customer ID stored in order

2. **Order**
   - Primary order record
   - Contains totals, statuses, metadata

3. **OrderLineItem[]**
   - One record per product in order
   - Contains quantity, price, discounts

4. **OrderTimeline[]**
   - FULFILLMENT event (PLACED)
   - PAYMENT event (PENDING or PAID)

5. **Outbox[]** (after transaction)
   - SMS tasks created by SmsTriggerService
   - Scheduled for future delivery

### Response Data Structure

```typescript
Order {
  id: number,
  orderNumber: string,
  customerId: number,
  orderDate: Date,
  orderType: OrderType,
  totalAmount: number,
  orderDiscount: number,
  voucherCode?: string,
  fulfillmentStatus: FulfillmentStatus,
  paymentStatus: PaymentStatus,
  paymentMethod?: PaymentMethod,
  shippingCost: number,
  customer: Customer,
  orderLineItems: OrderLineItem[]
}
```

---

## Integration Points

### 1. Customer Module
**Service**: `CustomerService`
**Method**: `findOrCreateCustomer()`
**Purpose**: Ensures customer exists before order creation
**Data Flow**: CustomerDetailsDto → Customer entity

### 2. Product Module
**Model**: `Product`
**Usage**: Validation and availability checking
**Data Flow**: Product IDs → Product entities → Validation

### 3. Discount Module
**Service**: `DiscountCalculationService`
**Method**: `calculateOrderDiscounts()`
**Purpose**: Computes all applicable discounts
**Data Flow**: 
- Order line items → Discount rules → Discount result
- Voucher codes → Discount lookup → Applied discounts

### 4. SMS Template Module
**Service**: `SmsTriggerService`
**Method**: `processSmsTemplates()`
**Purpose**: Triggers SMS notifications based on order events
**Data Flow**: Order + Trigger Event → Templates → Outbox entries

### 5. External SMS Module
**Service**: `SmsService`
**Method**: `sendSmsNotification()`
**Purpose**: Actual SMS delivery
**Data Flow**: OutboxProcessorService → SmsService → External SMS Provider

### 6. Accounts Module
**Service**: `AccountsService`
**Method**: `createAccountingEntriesForOrder()`
**Purpose**: Creates double-entry accounting records
**Usage**: Called when payment status changes to PAID
**Data Flow**: Order → Accounting transactions

---

## Event Sourcing & Timeline

### Event Sourcing Pattern

The system uses event sourcing to maintain a complete audit trail of all order changes. Every status change is recorded as an immutable event in the `OrderTimeline` table.

### Timeline Event Structure

```typescript
OrderTimeline {
  id: number,
  orderId: number,
  statusType: 'FULFILLMENT' | 'PAYMENT' | 'COMMUNICATION',
  eventValue: string, // e.g., 'PLACED', 'PAID', 'SMS_SENT'
  previousValue?: string, // Previous status value
  metadata: JSON, // Additional context
  note?: string, // Human-readable note
  userId?: number, // User who triggered the event
  idempotencyKey?: string, // For duplicate prevention
  eventVersion: string, // Schema version
  timestamp: Date // Auto-generated
}
```

### Event Types

#### FULFILLMENT Events
- `PLACED` - Order created
- `CONFIRMED` - Payment verified
- `PROCESSING` - Order being prepared
- `PACKAGING` - Items being packed
- `SHIPPED` - Order shipped
- `DELIVERED` - Order delivered
- `CANCELED` - Order canceled

#### PAYMENT Events
- `PENDING` - Payment pending
- `PAID` - Payment received
- `FAILED` - Payment failed

#### COMMUNICATION Events
- `SMS_SENT` - SMS notification sent
- Contains template info, message, send index

### Timeline Query Methods

```typescript
// Get all events for an order
getOrderTimeline(orderId: number): Promise<OrderTimeline[]>

// Get latest event by type
getLatestEventByType(orderId: number, statusType: StatusType): Promise<OrderTimeline>

// Get events in time range
getEventsInTimeRange(orderId: number, startDate: Date, endDate: Date): Promise<OrderTimeline[]>
```

---

## SMS Notification Flow

### Overview

SMS notifications are sent asynchronously using the Outbox Pattern to ensure reliable delivery even if the SMS service is temporarily unavailable.

### Flow Diagram

```
Order Created
    │
    ▼
SmsTriggerService.processSmsTemplates()
    │
    ├─► Find active templates for trigger event
    │
    ├─► Filter by order type (ONLINE/COUNTER)
    │
    ├─► Sort by priority
    │
    ├─► For each template:
    │   │
    │   ├─► Render message with order data
    │   │   - Replace variables: {orderNumber}, {customerName}, etc.
    │   │
    │   ├─► Calculate scheduled time
    │   │   - Base time = now + template.sendDelay
    │   │
    │   └─► Create outbox entries (template.sendCount times)
    │       - Each entry scheduled with delay
    │
    ▼
OutboxService.addOutboxEvent()
    │
    ▼
Outbox Table (Pending Tasks)
    │
    ▼
OutboxProcessorService (Cron: Every 30s)
    │
    ├─► Get pending tasks (scheduledFor <= now)
    │
    ├─► For each task:
    │   │
    │   ├─► Mark as PROCESSING
    │   │
    │   ├─► Send SMS via SmsService
    │   │
    │   ├─► Add COMMUNICATION event to timeline
    │   │
    │   └─► Mark as COMPLETED
    │
    └─► On failure:
        ├─► Increment retry count
        ├─► Reschedule with exponential backoff
        └─► Mark as FAILED after max retries
```

### Template Rendering

Templates support variables that are replaced with actual order data:

**Available Variables**:
- `{orderNumber}` - Order number (e.g., ORD-2024-0001)
- `{customerName}` - Customer name
- `{totalAmount}` - Order total
- `{orderDate}` - Order date
- `{paymentMethod}` - Payment method
- `{fulfillmentStatus}` - Current status
- `{feedbackLink}` - Feedback link (for delivered orders)
- Custom variables from `additionalData`

**Example Template**:
```
Hello {customerName}, your order {orderNumber} has been placed. 
Total: Nu. {totalAmount}. We'll notify you when it's confirmed.
```

**Rendered Message**:
```
Hello John Doe, your order ORD-2024-0001 has been placed. 
Total: Nu. 5000.00. We'll notify you when it's confirmed.
```

### Outbox Entry Structure

```typescript
Outbox {
  id: number,
  orderId: number,
  eventType: 'SEND_SMS' | 'SEND_EMAIL' | 'WEBHOOK',
  payload: {
    phoneNumber: string,
    message: string, // Rendered message
    templateId: number,
    templateName: string,
    sendIndex: number, // 1, 2, 3...
    totalSends: number
  },
  scheduledFor: Date,
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
  retryCount: number,
  errorMessage?: string
}
```

### Retry Logic

- **Max Retries**: 3
- **Initial Delay**: 60 seconds
- **Backoff**: Exponential (60s, 120s, 180s)
- **Failure**: After 3 retries, task marked as FAILED

---

## Discount Calculation Flow

### Overview

The discount system supports multiple discount types, scopes, and priority-based application. Discounts can be applied at the line item level or order level.

### Discount Types

1. **FLAT_ALL_PRODUCTS**
   - Applies to all products in the order
   - Can be LINE_ITEM or ORDER_TOTAL scope

2. **FLAT_SELECTED_PRODUCTS**
   - Applies only to specific products
   - Products linked via DiscountProduct junction table

3. **FLAT_SELECTED_CATEGORIES**
   - Applies to products in specific categories/subcategories
   - Categories linked via DiscountCategory/DiscountSubcategory tables

### Discount Calculation Process

```
1. Calculate Subtotal Before Discounts
   └─► Sum of (quantity × unitPrice) for all line items

2. Load Active Discounts
   └─► Query discounts where:
       - isActive = true
       - startDate <= now
       - endDate >= now (or null)

3. Filter Discounts
   ├─► By Voucher Code (if provided)
   │   └─► Only discounts with matching voucherCode
   │
   ├─► By Minimum Order Value
   │   └─► subtotal >= discount.minOrderValue
   │
   └─► By Usage Limits
       └─► discount.usageCount < discount.maxUsageCount

4. Sort by Priority
   └─► Higher priority discounts applied first

5. Apply Discounts (in priority order)
   ├─► Track discounted products (avoid double discounting)
   │
   ├─► For each discount:
   │   ├─► Match products (if SELECTED_PRODUCTS or SELECTED_CATEGORIES)
   │   ├─► Calculate discount amount
   │   │   ├─► PERCENTAGE: (amount × percentage) / 100
   │   │   └─► FIXED_AMOUNT: fixed value
   │   └─► Apply to line items or order total
   │
   └─► Skip products already discounted (higher priority)

6. Apply Quantity Threshold Discounts
   └─► For each line item:
       └─► If quantity >= product.quantityDiscountThreshold
           └─► Apply product.quantityDiscountPercentage

7. Calculate Final Totals
   ├─► Line item discount total
   ├─► Order discount total
   ├─► Subtotal after discounts
   └─► Final total (subtotal - discounts + shipping)
```

### Discount Value Types

1. **PERCENTAGE**
   - Discount value is a percentage (e.g., 10%)
   - Calculated as: `(amount × percentage) / 100`

2. **FIXED_AMOUNT**
   - Discount value is a fixed amount (e.g., Nu. 100)
   - Applied directly

### Discount Scopes

1. **LINE_ITEM**
   - Discount applied per product
   - Each line item gets its own discount amount

2. **ORDER_TOTAL**
   - Discount applied to entire order subtotal
   - Single discount amount for whole order

### Example Calculation

**Order**:
- Product A: 2 × Nu. 1000 = Nu. 2000
- Product B: 1 × Nu. 500 = Nu. 500
- Subtotal: Nu. 2500

**Active Discounts**:
1. "10% off all products" (Priority: 10, LINE_ITEM)
2. "Nu. 100 off Product A" (Priority: 5, LINE_ITEM)
3. "Nu. 50 off orders over Nu. 2000" (Priority: 1, ORDER_TOTAL)

**Calculation**:
1. Apply "10% off all products" (Priority 10):
   - Product A: Nu. 200 (10% of 2000)
   - Product B: Nu. 50 (10% of 500)
   - Products marked as discounted

2. Skip "Nu. 100 off Product A" (already discounted)

3. Apply "Nu. 50 off orders over Nu. 2000" (Priority 1):
   - Order discount: Nu. 50

**Result**:
- Line item discounts: Nu. 250
- Order discount: Nu. 50
- Final total: Nu. 2500 - Nu. 250 - Nu. 50 = Nu. 2200

---

## Error Handling

### Validation Errors

**BadRequestException**:
- No line items provided
- Product not available
- Invalid status transitions
- Invalid payment method

**NotFoundException**:
- Product not found
- Customer not found (for tracking)
- Order not found

### Transaction Rollback

If any step fails within the transaction:
- All database changes are rolled back
- No partial orders created
- Customer creation rolled back (if new customer)
- Timeline events not created

### SMS Failure Handling

**Outbox Pattern Benefits**:
- SMS failures don't affect order creation
- Retry mechanism handles temporary failures
- Failed tasks logged for manual review

**Retry Strategy**:
- Automatic retries with exponential backoff
- Max 3 retries before marking as failed
- Failed tasks can be manually reprocessed

### Discount Calculation Errors

- Errors in discount application are logged but don't fail order
- Order continues with available discounts
- Missing discounts logged for investigation

---

## Database Schema

### Order Table
```sql
CREATE TABLE Order (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderNumber VARCHAR(255) UNIQUE NOT NULL,
  customerId INT NOT NULL,
  orderDate DATETIME NOT NULL,
  orderType ENUM('ONLINE', 'COUNTER') NOT NULL,
  totalAmount DECIMAL(10,2) NOT NULL,
  orderDiscount DECIMAL(10,2) DEFAULT 0,
  voucherCode VARCHAR(255),
  fulfillmentStatus ENUM(...) NOT NULL,
  paymentStatus ENUM('PENDING', 'PAID', 'FAILED') NOT NULL,
  paymentMethod ENUM(...),
  shippingCost DECIMAL(10,2) DEFAULT 0,
  receiptGenerated BOOLEAN DEFAULT FALSE,
  receiptNumber VARCHAR(255) UNIQUE,
  paidAt DATETIME,
  paymentDate DATETIME,
  feedbackToken VARCHAR(255) UNIQUE,
  internalNotes TEXT,
  referrerSource VARCHAR(255),
  lastUpdated DATETIME,
  FOREIGN KEY (customerId) REFERENCES Customer(id)
);
```

### OrderLineItem Table
```sql
CREATE TABLE OrderLineItem (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderId INT NOT NULL,
  productId INT NOT NULL,
  quantity INT NOT NULL,
  unitPrice DECIMAL(10,2) NOT NULL,
  discountApplied DECIMAL(10,2) DEFAULT 0,
  lineTotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (orderId) REFERENCES Order(id),
  FOREIGN KEY (productId) REFERENCES Product(id)
);
```

### OrderTimeline Table
```sql
CREATE TABLE OrderTimeline (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderId INT NOT NULL,
  statusType ENUM('FULFILLMENT', 'PAYMENT', 'COMMUNICATION') NOT NULL,
  eventValue VARCHAR(255) NOT NULL,
  previousValue VARCHAR(255),
  metadata JSON,
  note TEXT,
  userId INT,
  idempotencyKey VARCHAR(255),
  eventVersion VARCHAR(50) DEFAULT '1.0',
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES Order(id)
);
```

### Outbox Table
```sql
CREATE TABLE Outbox (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderId INT NOT NULL,
  eventType ENUM('SEND_SMS', 'SEND_EMAIL', 'WEBHOOK') NOT NULL,
  payload JSON NOT NULL,
  scheduledFor DATETIME NOT NULL,
  status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL,
  retryCount INT DEFAULT 0,
  errorMessage TEXT,
  FOREIGN KEY (orderId) REFERENCES Order(id)
);
```

---

## Summary

The order placement workflow is a robust, event-driven system that:

1. **Ensures Data Consistency**: Uses database transactions for atomic operations
2. **Tracks Complete History**: Event sourcing via OrderTimeline
3. **Handles Discounts Intelligently**: Multi-level discount calculation with priority
4. **Sends Notifications Reliably**: Outbox pattern for SMS delivery
5. **Scales Asynchronously**: Non-blocking SMS processing
6. **Maintains Audit Trail**: Complete order history for compliance

The system is designed to handle both online and counter orders, with different payment flows and notification triggers based on order type.

