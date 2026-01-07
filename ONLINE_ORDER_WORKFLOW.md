# Order Workflow & SMS Message System (Online & Counter Orders)

## Table of Contents
1. [Overview](#overview)
2. [Order Types](#order-types)
3. [Order Lifecycle States](#order-lifecycle-states)
4. [Online Order Workflow](#online-order-workflow)
5. [Counter Order Workflow](#counter-order-workflow)
6. [SMS Message System Architecture](#sms-message-system-architecture)
7. [Detailed Step-by-Step Process](#detailed-step-by-step-process)
8. [SMS Template Configuration](#sms-template-configuration)
9. [Timeline Events & Audit Trail](#timeline-events--audit-trail)
10. [Order Type Comparison](#order-type-comparison)

---

## Overview

The order system supports both **Online** and **Counter** orders using an **event-driven SMS template system**. All SMS messages are sent through a configurable template system and processed asynchronously via an **Outbox Pattern** for reliability.

### Key Components:
- **Event-Driven Architecture**: Order state changes trigger SMS templates
- **SMS Template System**: Configurable messages triggered by order events
- **Outbox Processor**: Reliable asynchronous SMS delivery
- **Order Timeline**: Immutable audit trail of all events
- **Circuit Breaker**: Resilient external service calls
- **Idempotency**: Prevents duplicate processing

---

## Order Types

### Online Orders (`OrderType.ONLINE`)
- Placed by customers through web/mobile interface
- Payment typically processed after order placement
- Requires shipping/delivery workflow
- Full lifecycle: PLACED → CONFIRMED → PROCESSING → PACKAGING → SHIPPED → DELIVERED

### Counter Orders (`OrderType.COUNTER`)
- Placed at physical store/counter
- Payment usually processed immediately at time of order
- May skip shipping steps if customer takes items immediately
- Can be marked as DELIVERED immediately if customer takes items on-site

---

## Order Lifecycle States

### Fulfillment Status Flow:
```
PLACED → CONFIRMED → PROCESSING → PACKAGING → SHIPPED → DELIVERED
   ↓         ↓            ↓            ↓          ↓
CANCELED  CANCELED    CANCELED     CANCELED   CANCELED
```

**Note**: Counter orders may skip intermediate steps (e.g., PLACED → DELIVERED if customer takes items immediately)

### Payment Status Flow:
```
PENDING → PAID
   ↓
FAILED
```

**Note**: Counter orders with payment method set at creation start with `PAID` status

---

## Online Order Workflow

### 1. **Order Placement** 🛒

**Endpoint**: `POST /orders`

**Request Flow**:
```
Client → OrderController.createOrder() 
      → OrderService.createOrder() 
      → CommandBus.execute(CreateOrderCommand)
      → CreateOrderHandler.execute()
```

**What Happens**:
1. Customer details are validated/created
2. Products are validated and quantities checked
3. Order is created with status:
   - `fulfillmentStatus: PLACED`
   - `paymentStatus: PENDING`
   - `orderType: ONLINE`
4. Order number is generated (e.g., `ORD-2025-0001`)
5. Timeline event created: `FULFILLMENT → PLACED`
6. Timeline event created: `PAYMENT → PENDING`
7. **SMS Trigger**: `ORDER_PLACED` event

**SMS Message Flow**:
```
CreateOrderHandler.execute()
  ↓
smsTriggerService.processSmsTemplates(order, ORDER_PLACED)
  ↓
smsTemplateService.findActiveTemplatesByTrigger(ORDER_PLACED, ONLINE)
  ↓ (finds active templates for ORDER_PLACED event)
  ↓
For each template:
  - Render message with placeholders ({{orderNumber}}, {{customerName}}, etc.)
  - Create Outbox entry with rendered message
  - Schedule based on template.sendDelay
  ↓
Outbox entries created with status: PENDING
```

**Example SMS Template**:
```json
{
  "name": "Order Confirmation",
  "triggerEvent": "ORDER_PLACED",
  "message": "Thank you {{customerName}}! Your order {{orderNumber}} has been placed. Total: {{totalAmount}}. We'll notify you once payment is confirmed.",
  "isActive": true,
  "sendCount": 1,
  "sendDelay": 0,
  "orderType": null
}
```

**Outbox Entry Created**:
```json
{
  "orderId": 123,
  "eventType": "SEND_SMS",
  "payload": {
    "phoneNumber": "+97517123456",
    "message": "Thank you John! Your order ORD-2025-0001 has been placed...",
    "templateId": 1,
    "templateName": "Order Confirmation"
  },
  "scheduledFor": "2025-01-20T10:00:00Z",
  "status": "PENDING"
}
```

---

### 2. **Payment Processing** 💳

**Endpoint**: `POST /orders/:id/payment`

**Request Flow**:
```
Client → OrderController.processPayment()
      → OrderService.processPayment()
      → CommandBus.execute(UpdatePaymentStatusCommand)
      → UpdatePaymentStatusHandler.execute()
```

**What Happens**:
1. Order validation (must be PLACED or CONFIRMED)
2. Payment details are validated
3. Payment status updated to `PAID`
4. If order was `PLACED`, fulfillment status auto-updated to `CONFIRMED`
5. Timeline event created: `PAYMENT → PAID`
6. Timeline event created: `FULFILLMENT → CONFIRMED` (if applicable)
7. Receipt number generated
8. Accounting entries created
9. **SMS Trigger**: `PLACED_TO_CONFIRMED` event

**SMS Message Flow**:
```
UpdatePaymentStatusHandler.execute()
  ↓ (payment status changed to PAID)
  ↓
smsTriggerService.processSmsTemplates(order, PLACED_TO_CONFIRMED)
  ↓
smsTemplateService.findActiveTemplatesByTrigger(PLACED_TO_CONFIRMED, ONLINE)
  ↓ (finds active templates for PLACED_TO_CONFIRMED event)
  ↓
For each template:
  - Render message with placeholders
  - Create Outbox entry(s) based on sendCount
  - Schedule based on sendDelay
```

**Example SMS Template**:
```json
{
  "name": "Payment Confirmed",
  "triggerEvent": "PLACED_TO_CONFIRMED",
  "message": "Payment confirmed for order {{orderNumber}}! Receipt: {{receiptNumber}}. We're now processing your order.",
  "isActive": true,
  "sendCount": 1,
  "sendDelay": 0
}
```

---

### 3. **Order Processing** ⚙️

**Endpoint**: `PATCH /orders/:id/fulfillment-status`

**Request Flow**:
```
Client → OrderController.updateFulfillmentStatus()
      → OrderService.updateFulfillmentStatus()
      → CommandBus.execute(UpdateFulfillmentStatusCommand)
      → UpdateFulfillmentStatusHandler.execute()
```

**What Happens**:
1. Status transition validated (CONFIRMED → PROCESSING)
2. Fulfillment status updated to `PROCESSING`
3. Timeline event created: `FULFILLMENT → PROCESSING`
4. **SMS Trigger**: `CONFIRMED_TO_PROCESSING` event

**SMS Message Flow**:
```
UpdateFulfillmentStatusHandler.execute()
  ↓
smsTriggerService.getTriggerEvent(CONFIRMED, PROCESSING)
  ↓ (returns CONFIRMED_TO_PROCESSING)
  ↓
smsTriggerService.processSmsTemplates(order, CONFIRMED_TO_PROCESSING)
```

**Example SMS Template**:
```json
{
  "name": "Order Processing",
  "triggerEvent": "CONFIRMED_TO_PROCESSING",
  "message": "Great news! We're now processing your order {{orderNumber}}. We'll keep you updated on the progress.",
  "isActive": true,
  "sendCount": 1,
  "sendDelay": 0
}
```

---

### 4. **Packaging** 📦

**Endpoint**: `PATCH /orders/:id/fulfillment-status`

**Status Change**: `PROCESSING → PACKAGING`

**SMS Trigger**: `PROCESSING_TO_PACKAGING`

**Example SMS Template**:
```json
{
  "name": "Order Packaged",
  "triggerEvent": "PROCESSING_TO_PACKAGING",
  "message": "Your order {{orderNumber}} has been packaged and is ready for shipment!",
  "isActive": true,
  "sendCount": 1,
  "sendDelay": 0
}
```

---

### 5. **Shipping** 🚚

**Endpoint**: `POST /orders/:id/ship`

**Request Flow**:
```
Client → OrderController.shipOrder()
      → OrderService.shipOrder() 
      → CommandBus.execute(ShipOrderCommand)
      → ShipOrderHandler.execute()
```

**What Happens**:
1. Status validation (must be PACKAGING)
2. Driver information captured (name, phone, vehicle number)
3. Fulfillment status updated to `SHIPPED`
4. Timeline event created: `FULFILLMENT → SHIPPED` (with driver metadata)
5. **SMS Trigger**: `PACKAGING_TO_SHIPPED` event

**SMS Message Flow**:
```
ShipOrderHandler.execute()
  ↓
smsTriggerService.processSmsTemplates(order, PACKAGING_TO_SHIPPED, {
  driverName: "John Driver",
  driverPhone: "+97517123456",
  vehicleNumber: "BT-1234"
})
  ↓
Templates can use {{driverName}}, {{driverPhone}}, {{vehicleNumber}}
```

**Example SMS Template**:
```json
{
  "name": "Order Shipped",
  "triggerEvent": "PACKAGING_TO_SHIPPED",
  "message": "Your order {{orderNumber}} is on the way! Driver: {{driverName}}, Phone: {{driverPhone}}, Vehicle: {{vehicleNumber}}. Expected delivery soon.",
  "isActive": true,
  "sendCount": 1,
  "sendDelay": 0
}
```

---

### 6. **Delivery** ✅

**Endpoint**: `POST /orders/:id/deliver`

**Request Flow**:
```
Client → OrderController.markOrderAsDelivered()
      → OrderService.markOrderAsDelivered()
      → CommandBus.execute(MarkDeliveredCommand)
      → MarkDeliveredHandler.execute()
```

**What Happens**:
1. Status validation (must be SHIPPED)
2. Unique feedback token generated (UUID)
3. Fulfillment status updated to `DELIVERED`
4. Timeline event created: `FULFILLMENT → DELIVERED` (with feedbackToken metadata)
5. Product sales counts incremented
6. **SMS Trigger**: `SHIPPED_TO_DELIVERED` event

**SMS Message Flow**:
```
MarkDeliveredHandler.execute()
  ↓
feedbackLink = "https://yoursite.com/feedback/{uuid}"
  ↓
smsTriggerService.processSmsTemplates(order, SHIPPED_TO_DELIVERED, {
  feedbackLink: "https://yoursite.com/feedback/abc123..."
})
  ↓
Templates can use {{feedbackLink}}
```

**Example SMS Template**:
```json
{
  "name": "Order Delivered",
  "triggerEvent": "SHIPPED_TO_DELIVERED",
  "message": "🎉 Your order {{orderNumber}} has been delivered! We hope you love it. Please share your feedback: {{feedbackLink}}",
  "isActive": true,
  "sendCount": 1,
  "sendDelay": 0
}
```

---

### 7. **Order Cancellation** ❌

**Endpoint**: `POST /orders/:id/cancel`

**Request Flow**:
```
Client → OrderController.cancelOrder()
      → OrderService.cancelOrder()
      → CommandBus.execute(UpdateFulfillmentStatusCommand)
      → UpdateFulfillmentStatusHandler.execute()
```

**What Happens**:
1. Order validation
2. If delivered, create reversal accounting entries
3. Fulfillment status updated to `CANCELED`
4. Payment status updated to `FAILED`
5. Timeline event created: `FULFILLMENT → CANCELED`
6. **SMS Trigger**: `ORDER_CANCELED` event

**Example SMS Template**:
```json
{
  "name": "Order Cancelled",
  "triggerEvent": "ORDER_CANCELED",
  "message": "Your order {{orderNumber}} has been cancelled. If payment was made, refund will be processed. Contact us for assistance.",
  "isActive": true,
  "sendCount": 1,
  "sendDelay": 0
}
```

---

## SMS Message System Architecture

### 1. **Template System** 📝

Templates are stored in the `sms_templates` table and can be:
- **Configured by admins** via API endpoints
- **Active/Inactive** - only active templates are used
- **Order-type specific** - can apply to ONLINE, COUNTER, or both
- **Priority-based** - multiple templates per event are processed in priority order
- **Multi-send capable** - can send multiple times (sendCount) with delays

**Template Fields**:
- `name`: Template identifier
- `triggerEvent`: When to trigger (ORDER_PLACED, PLACED_TO_CONFIRMED, etc.)
- `message`: Message with placeholders ({{orderNumber}}, {{customerName}}, etc.)
- `isActive`: Enable/disable template
- `sendCount`: How many times to send (e.g., 3 reminders)
- `sendDelay`: Delay in minutes before sending (e.g., 10 minutes)
- `orderType`: ONLINE, COUNTER, or null (both)
- `priority`: Order of execution if multiple templates exist

### 2. **Placeholder System** 🔤

Templates support dynamic placeholders that are replaced with actual values:

**Available Placeholders**:
- `{{orderNumber}}` - Order number (e.g., ORD-2025-0001)
- `{{customerName}}` - Customer name
- `{{customerPhone}}` - Customer phone number
- `{{totalAmount}}` - Total order amount
- `{{receiptNumber}}` - Receipt number (when available)
- `{{driverName}}` - Driver name (shipping only)
- `{{driverPhone}}` - Driver phone (shipping only)
- `{{vehicleNumber}}` - Vehicle number (shipping only)
- `{{feedbackLink}}` - Feedback URL (delivery only)

**Placeholder Replacement Process**:
```
Template: "Order {{orderNumber}} for {{customerName}}"
         ↓
Order: { orderNumber: "ORD-2025-0001", customer: { name: "John" } }
         ↓
Rendered: "Order ORD-2025-0001 for John"
```

### 3. **Outbox Pattern** 📮

All SMS messages are queued in the `outbox` table for reliable delivery:

**Outbox Entry Structure**:
```json
{
  "id": 1,
  "orderId": 123,
  "eventType": "SEND_SMS",
  "payload": {
    "phoneNumber": "+97517123456",
    "message": "Rendered message here...",
    "templateId": 1,
    "templateName": "Order Confirmation",
    "sendIndex": 1,
    "totalSends": 1
  },
  "scheduledFor": "2025-01-20T10:00:00Z",
  "status": "PENDING",
  "retryCount": 0,
  "errorMessage": null
}
```

**Outbox Statuses**:
- `PENDING` - Waiting to be processed
- `PROCESSING` - Currently being sent
- `COMPLETED` - Successfully sent
- `FAILED` - Failed after max retries

### 4. **Outbox Processor** ⚙️

A cron job runs every 30 seconds to process pending outbox entries:

```
@Cron(CronExpression.EVERY_30_SECONDS)
processOutbox()
  ↓
Find all PENDING entries where scheduledFor <= now
  ↓
For each entry:
  1. Mark as PROCESSING
  2. Send SMS via SmsService (with circuit breaker)
  3. Create timeline event: COMMUNICATION → SMS_SENT
  4. Mark as COMPLETED
  5. If failed: retry (up to 3 times) or mark as FAILED
```

**Circuit Breaker Protection**:
- Prevents cascading failures if SMS service is down
- Auto-retries after timeout period
- Falls back gracefully

---

## Detailed Step-by-Step Process

### Complete Flow Example: Order #ORD-2025-0001

#### Step 1: Customer Places Order
```
1. POST /orders
   Body: { customer: {...}, orderLineItems: [...], orderType: "ONLINE" }
   
2. CreateOrderHandler executes:
   - Creates order with PLACED status
   - Creates timeline: FULFILLMENT → PLACED
   - Creates timeline: PAYMENT → PENDING
   
3. SMS Trigger: ORDER_PLACED
   - Finds template: "Order Confirmation"
   - Renders: "Thank you John! Order ORD-2025-0001 placed..."
   - Creates Outbox entry (scheduled: now + 0 minutes)
   
4. Outbox Processor (runs every 30s):
   - Finds pending SMS
   - Sends SMS to customer
   - Creates timeline: COMMUNICATION → SMS_SENT
   - Marks outbox as COMPLETED
```

#### Step 2: Payment Received
```
1. POST /orders/123/payment
   Body: { paymentMethod: "BANK_TRANSFER", paymentDate: "2025-01-20" }
   
2. UpdatePaymentStatusHandler executes:
   - Updates payment status to PAID
   - Auto-updates fulfillment to CONFIRMED
   - Creates timeline: PAYMENT → PAID
   - Creates timeline: FULFILLMENT → CONFIRMED
   - Generates receipt number
   
3. SMS Trigger: PLACED_TO_CONFIRMED
   - Finds template: "Payment Confirmed"
   - Renders: "Payment confirmed! Order ORD-2025-0001, Receipt: RCP-001..."
   - Creates Outbox entry
   
4. Outbox Processor sends SMS
```

#### Step 3: Order Processing
```
1. PATCH /orders/123/fulfillment-status
   Body: { fulfillmentStatus: "PROCESSING" }
   
2. UpdateFulfillmentStatusHandler executes:
   - Updates status: CONFIRMED → PROCESSING
   - Creates timeline: FULFILLMENT → PROCESSING
   
3. SMS Trigger: CONFIRMED_TO_PROCESSING
   - Finds template: "Order Processing"
   - Renders and queues SMS
```

#### Step 4: Packaging
```
1. PATCH /orders/123/fulfillment-status
   Body: { fulfillmentStatus: "PACKAGING" }
   
2. SMS Trigger: PROCESSING_TO_PACKAGING
   - Finds template: "Order Packaged"
   - Renders and queues SMS
```

#### Step 5: Shipping
```
1. POST /orders/123/ship
   Body: { 
     driverName: "John Driver",
     driverPhone: "+97517123456",
     vehicleNumber: "BT-1234"
   }
   
2. ShipOrderHandler executes:
   - Updates status: PACKAGING → SHIPPED
   - Creates timeline: FULFILLMENT → SHIPPED (with driver metadata)
   
3. SMS Trigger: PACKAGING_TO_SHIPPED
   - Finds template: "Order Shipped"
   - Renders with driver info: "Order shipped! Driver: John Driver..."
   - Queues SMS
```

#### Step 6: Delivery
```
1. POST /orders/123/deliver
   
2. MarkDeliveredHandler executes:
   - Generates feedback token: "abc123-def456..."
   - Updates status: SHIPPED → DELIVERED
   - Creates timeline: FULFILLMENT → DELIVERED
   - Increments product sales counts
   
3. SMS Trigger: SHIPPED_TO_DELIVERED
   - Finds template: "Order Delivered"
   - Renders with feedback link: "Order delivered! Feedback: https://..."
   - Queues SMS
```

---

## SMS Template Configuration

### Creating a Template

**Endpoint**: `POST /sms-templates`

**Example Request**:
```json
{
  "name": "Order Confirmation",
  "triggerEvent": "ORDER_PLACED",
  "message": "Thank you {{customerName}}! Your order {{orderNumber}} has been placed. Total: {{totalAmount}}.",
  "isActive": true,
  "sendCount": 1,
  "sendDelay": 0,
  "orderType": "ONLINE",
  "priority": 0
}
```

### Advanced Template: Multiple Sends with Delays

**Example**: Send 3 reminder SMSs 10 minutes apart
```json
{
  "name": "Payment Reminder",
  "triggerEvent": "ORDER_PLACED",
  "message": "Reminder: Please complete payment for order {{orderNumber}}. Total: {{totalAmount}}.",
  "isActive": true,
  "sendCount": 3,
  "sendDelay": 10,
  "orderType": "ONLINE",
  "priority": 1
}
```

**How it works**:
- First SMS: sent immediately (sendDelay = 0 for first)
- Second SMS: sent 10 minutes later (sendDelay * 1)
- Third SMS: sent 20 minutes later (sendDelay * 2)

### Testing Templates

**Endpoint**: `POST /sms-templates/:id/test`

**Request**:
```json
{
  "orderId": 123
}
```

**Response**:
```json
{
  "renderedMessage": "Thank you John! Your order ORD-2025-0001...",
  "template": { ... }
}
```

---

## Timeline Events & Audit Trail

Every order action creates an immutable timeline event in the `order_timelines` table:

### Timeline Event Types:

1. **FULFILLMENT** - Order status changes
   - `PLACED`, `CONFIRMED`, `PROCESSING`, `PACKAGING`, `SHIPPED`, `DELIVERED`, `CANCELED`

2. **PAYMENT** - Payment status changes
   - `PENDING`, `PAID`, `FAILED`

3. **COMMUNICATION** - SMS/Email sent
   - `SMS_SENT` (with metadata: templateId, message, sendIndex, etc.)

4. **SYSTEM** - System events
   - Auto-delivery, cron jobs, etc.

5. **SHIPPING** - Shipping-specific events
   - Driver assignments, tracking updates, etc.

### Example Timeline for Order #123:

```
1. FULFILLMENT → PLACED        (2025-01-20 10:00:00)
2. PAYMENT → PENDING            (2025-01-20 10:00:00)
3. COMMUNICATION → SMS_SENT     (2025-01-20 10:00:05) [Template: Order Confirmation]
4. PAYMENT → PAID               (2025-01-20 10:15:30)
5. FULFILLMENT → CONFIRMED      (2025-01-20 10:15:30)
6. COMMUNICATION → SMS_SENT     (2025-01-20 10:15:35) [Template: Payment Confirmed]
7. FULFILLMENT → PROCESSING     (2025-01-20 11:00:00)
8. COMMUNICATION → SMS_SENT     (2025-01-20 11:00:05) [Template: Order Processing]
9. FULFILLMENT → PACKAGING      (2025-01-20 12:00:00)
10. FULFILLMENT → SHIPPED        (2025-01-20 13:00:00) [Metadata: driver info]
11. COMMUNICATION → SMS_SENT     (2025-01-20 13:00:05) [Template: Order Shipped]
12. FULFILLMENT → DELIVERED      (2025-01-20 14:00:00) [Metadata: feedbackToken]
13. COMMUNICATION → SMS_SENT     (2025-01-20 14:00:05) [Template: Order Delivered]
```

### Querying Timeline:

**Endpoint**: `GET /orders/:id/timeline`

**Response**:
```json
[
  {
    "id": 1,
    "statusType": "FULFILLMENT",
    "eventValue": "PLACED",
    "timestamp": "2025-01-20T10:00:00Z",
    "metadata": { "orderType": "ONLINE" }
  },
  {
    "id": 3,
    "statusType": "COMMUNICATION",
    "eventValue": "SMS_SENT",
    "timestamp": "2025-01-20T10:00:05Z",
    "metadata": {
      "templateId": 1,
      "templateName": "Order Confirmation",
      "phoneNumber": "+97517123456",
      "sendIndex": 1,
      "totalSends": 1
    }
  }
]
```

---

## Key Features

### 1. **Reliability**
- ✅ Outbox pattern ensures no SMS is lost
- ✅ Retry mechanism (up to 3 attempts)
- ✅ Circuit breaker prevents cascading failures
- ✅ Idempotency keys prevent duplicate processing

### 2. **Flexibility**
- ✅ Admin-configurable templates
- ✅ Multiple templates per event
- ✅ Order-type specific templates
- ✅ Dynamic placeholders
- ✅ Multi-send with delays

### 3. **Auditability**
- ✅ Complete timeline of all events
- ✅ SMS sent events tracked with metadata
- ✅ Immutable audit trail

### 4. **Performance**
- ✅ Asynchronous SMS processing
- ✅ Non-blocking order operations
- ✅ Scheduled delivery support
- ✅ Batch processing via outbox

---

## Summary

The online order workflow is a complete, event-driven system where:

1. **Order state changes** trigger **SMS template events**
2. **Templates are rendered** with order/customer data
3. **Messages are queued** in the outbox table
4. **Outbox processor** sends SMS asynchronously
5. **Timeline events** track everything for audit

**Key Principle**: If no SMS template is configured for an event, no SMS will be sent. This gives admins full control over customer communication.

