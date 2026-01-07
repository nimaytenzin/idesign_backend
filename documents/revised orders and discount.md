# Frontend Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [API Base URL](#api-base-url)
3. [Authentication](#authentication)
4. [Order Module](#order-module)
5. [Product Module](#product-module)
6. [Customer Module](#customer-module)
7. [Discount Module](#discount-module)
8. [Order Processing Workflow](#order-processing-workflow)
9. [Discount Application System](#discount-application-system)
10. [Integration Examples](#integration-examples)

---

## Overview

This guide provides comprehensive documentation for frontend developers implementing the iDesign backend API. It covers all routes, DTOs, workflows, and integration patterns for the Order, Product, Customer, and Discount modules.

---

## API Base URL

```
Base URL: http://localhost:3000 (or your production URL)
```

All endpoints are prefixed with their respective module paths:
- `/orders` - Order operations
- `/products` - Product operations
- `/customers` - Customer operations
- `/discounts` - Discount operations

---

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

**Note:** Discount endpoints require authentication. Order, Product, and Customer endpoints may vary based on your configuration.

---

## Order Module

### Routes

#### 1. Create Order
```http
POST /orders
```

**Request Body:**
```typescript
interface CreateOrderDto {
  customer: {
    name?: string;
    email?: string;
    phoneNumber?: string;
    shippingAddress?: string;
    billingAddress?: string;
  };
  orderItems: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
    discountApplied?: number; // Optional, calculated automatically
  }>;
  orderType?: 'ONLINE' | 'COUNTER'; // Default: 'ONLINE'
  paymentMethod?: 'CASH' | 'MBOB' | 'BDB_EPAY' | 'TPAY' | 'BNB_MPAY' | 'ZPSS';
  orderDiscount?: number; // Optional, calculated automatically
  voucherCode?: string; // Optional voucher code
  shippingCost?: number; // Default: 0
  internalNotes?: string;
  referrerSource?: string; // Auto-extracted from referer header if not provided
}
```

**Response:**
```typescript
interface Order {
  id: number;
  orderNumber: string; // Format: ORD-YYYY-XXXX
  customerId: number;
  orderDate: string; // ISO date string
  orderType: 'ONLINE' | 'COUNTER';
  totalAmount: number;
  orderDiscount: number;
  voucherCode: string | null;
  fulfillmentStatus: 'PLACED' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  paymentMethod: string | null;
  shippingCost: number;
  receiptNumber: string | null;
  receiptGenerated: boolean;
  placedAt: string;
  confirmedAt: string | null;
  processingAt: string | null;
  shippingAt: string | null;
  deliveredAt: string | null;
  canceledAt: string | null;
  driverName: string | null;
  driverPhone: string | null;
  vehicleNumber: string | null;
  customer: Customer;
  orderItems: OrderItem[];
  orderDiscounts: OrderDiscount[];
}
```

**Example:**
```typescript
const createOrder = async (orderData: CreateOrderDto) => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });
  return response.json();
};
```

#### 2. Get All Orders
```http
GET /orders?customerId=1&fulfillmentStatus=PLACED&startDate=2024-01-01&endDate=2024-12-31
```

**Query Parameters:**
- `customerId` (optional): Filter by customer ID
- `fulfillmentStatus` (optional): Filter by status
- `startDate` (optional): Filter orders from date (ISO string)
- `endDate` (optional): Filter orders to date (ISO string)

**Response:** Array of Order objects

#### 3. Get Single Order
```http
GET /orders/:id
```

**Response:** Order object with `customerStatusMessage` field

#### 4. Track Order
```http
GET /orders/track?orderNumber=ORD-2024-0001
GET /orders/track?phoneNumber=9751234567
```

**Query Parameters:**
- `orderNumber` (optional): Track by order number
- `phoneNumber` (optional): Track by customer phone (returns all orders)

**Response:** Single Order or Array of Orders

#### 5. Update Order
```http
PATCH /orders/:id
```

**Request Body:**
```typescript
interface UpdateOrderDto {
  orderItems?: CreateOrderItemDto[]; // Replaces all items
  shippingCost?: number;
  internalNotes?: string;
}
```

**Note:** Cannot update delivered or canceled orders.

#### 6. Update Order Status
```http
PATCH /orders/:id/status
```

**Request Body:**
```typescript
interface UpdateOrderStatusDto {
  fulfillmentStatus?: FulfillmentStatus;
  paymentStatus?: PaymentStatus;
  internalNotes?: string;
}
```

#### 7. Update Fulfillment Status
```http
PATCH /orders/:id/fulfillment-status
```

**Request Body:**
```typescript
interface UpdateFulfillmentStatusDto {
  fulfillmentStatus: 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELED';
  driverName?: string; // Required for SHIPPING status
  driverPhone?: string; // Required for SHIPPING status
  vehicleNumber?: string; // Required for SHIPPING status
  internalNotes?: string;
}
```

**Status Transition Rules:**
- PLACED → CONFIRMED, CANCELED
- CONFIRMED → PROCESSING, CANCELED
- PROCESSING → SHIPPING, CANCELED
- SHIPPING → DELIVERED, CANCELED
- DELIVERED → (no transitions)
- CANCELED → (no transitions)

#### 8. Update Payment Status
```http
PATCH /orders/:id/payment-status
```

**Request Body:**
```typescript
interface UpdatePaymentStatusDto {
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  paymentMethod?: PaymentMethod;
  transactionId?: string;
}
```

**Note:** When payment status changes to PAID:
- Fulfillment status auto-updates to CONFIRMED if currently PLACED
- Receipt is generated automatically
- Accounting entries are created
- SMS notifications are triggered

#### 9. Process Payment
```http
POST /orders/:id/payment
```

**Request Body:**
```typescript
interface ProcessPaymentDto {
  paymentMethod: 'CASH' | 'MBOB' | 'BDB_EPAY' | 'TPAY' | 'BNB_MPAY' | 'ZPSS';
  paymentDate?: string; // ISO date string, defaults to now
  internalNotes?: string;
}
```

**Response:** Updated Order with payment processed

#### 10. Verify Order
```http
POST /orders/:id/verify
```

**Request Body:**
```typescript
interface VerifyOrderDto {
  internalNotes?: string;
}
```

**Note:** Only required for payment methods other than ZPSS. Sets payment status to PAID.

#### 11. Cancel Order
```http
POST /orders/:id/cancel
```

**Request Body:**
```typescript
{
  reason?: string;
}
```

**Response:** Canceled Order

#### 12. Mark Order as Delivered
```http
POST /orders/:id/deliver
```

**Request Body:**
```typescript
interface MarkDeliveredDto {
  // Optional - no body required
}
```

**Response:** Order with `deliveredAt` timestamp and `feedbackToken`

#### 13. Get Customer Status
```http
GET /orders/:id/customer-status
```

**Response:**
```typescript
interface GetCustomerStatusDto {
  customerStatusMessage: string;
  fulfillmentStatus: FulfillmentStatus;
  paymentStatus: PaymentStatus;
  trackingNumber?: string;
}
```

#### 14. Get Orders by Month
```http
GET /orders/by-month?year=2024&month=1
```

**Response:**
```typescript
interface OrdersByMonthResponseDto {
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  totalOrders: number;
  orders: Order[];
}
```

#### 15. Get Order Statistics by Month
```http
GET /orders/statistics/by-month?year=2024&month=1
```

**Response:**
```typescript
interface OrderStatisticsByMonthResponseDto {
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
    SHIPPING: number;
    DELIVERED: number;
    CANCELED: number;
  };
  ordersByPaymentMethod: Record<string, number>;
  completedOrders: number;
  completedRevenue: number;
  cancelledOrders: number;
  pendingOrders: number;
}
```

---

## Product Module

### Routes

#### 1. Create Product
```http
POST /products
```

**Request Body:**
```typescript
interface CreateProductDto {
  title: string;
  shortDescription: string;
  detailedDescription: string;
  dimensions: string;
  weight: number;
  price: number;
  material: string;
  isAvailable?: boolean; // Default: true
  isFeatured?: boolean; // Default: false
  productSubCategoryId: number;
  stockQuantity?: number; // Default: 0
}
```

**Response:** Product object

#### 2. Get All Products (Public)
```http
GET /products?categoryId=1&subCategoryId=2&isAvailable=true&isFeatured=true
```

**Query Parameters:**
- `categoryId` (optional): Filter by category
- `subCategoryId` (optional): Filter by subcategory
- `isAvailable` (optional): Filter by availability
- `isFeatured` (optional): Filter featured products

**Response:** Array of Product objects

#### 3. Get All Products (Admin)
```http
GET /products/admin
```

**Response:** Array of all Product objects (including unavailable)

#### 4. Get Featured Products
```http
GET /products/featured
```

**Response:** Array of featured Product objects

#### 5. Get Single Product
```http
GET /products/:id
```

**Response:** Product object with images

#### 6. Update Product
```http
PATCH /products/:id
```

**Request Body:** Partial CreateProductDto

#### 7. Delete Product
```http
DELETE /products/:id
```

#### 8. Add Product Images
```http
POST /products/:id/images
Content-Type: multipart/form-data
```

**Form Data:**
- `images`: Array of image files (max 10, 5MB each)
- `orientations`: JSON array of orientations ['square', 'portrait', 'landscape']
- `altTexts`: JSON array of alt texts
- `isPrimary`: JSON array of booleans

**Response:** Array of ProductImage objects

#### 9. Get Product Images
```http
GET /products/:id/images
```

**Response:** Array of ProductImage objects

#### 10. Update Product Image
```http
PATCH /products/:productId/images/:imageId
```

**Request Body:**
```typescript
interface UpdateProductImageDto {
  orientation?: 'square' | 'portrait' | 'landscape';
  altText?: string;
  isPrimary?: boolean;
}
```

#### 11. Delete Product Image
```http
DELETE /products/:productId/images/:imageId
```

#### 12. Set Primary Image
```http
PATCH /products/:productId/images/:imageId/primary
```

---

## Customer Module

### Routes

#### 1. Create Customer
```http
POST /customers
```

**Request Body:**
```typescript
interface CreateCustomerDto {
  name?: string;
  email?: string;
  phoneNumber?: string;
  shippingAddress?: string;
  billingAddress?: string;
}
```

**Response:** Customer object

**Note:** Customer is automatically created/found during order creation using `findOrCreateCustomer` logic.

#### 2. Get All Customers
```http
GET /customers
```

**Response:** Array of Customer objects

#### 3. Get Single Customer
```http
GET /customers/:id
```

**Response:** Customer object

#### 4. Update Customer
```http
PATCH /customers/:id
```

**Request Body:** Partial CreateCustomerDto

#### 5. Delete Customer
```http
DELETE /customers/:id
```

---

## Discount Module

### Routes

**Note:** All discount endpoints require JWT authentication.

#### 1. Create Discount
```http
POST /discounts
```

**Request Body:**
```typescript
interface CreateDiscountDto {
  name: string;
  description?: string;
  discountType: 'FLAT_ALL_PRODUCTS' | 'FLAT_SELECTED_PRODUCTS' | 'FLAT_SELECTED_CATEGORIES';
  valueType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number; // Percentage (0-100) or fixed amount
  discountScope?: 'PER_PRODUCT' | 'ORDER_TOTAL'; // Default: 'PER_PRODUCT'
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  isActive?: boolean; // Default: true
  maxUsageCount?: number; // Optional usage limit
  minOrderValue?: number; // Optional minimum order requirement
  voucherCode?: string; // Optional voucher code (if requires code)
  // For FLAT_SELECTED_PRODUCTS
  productIds?: number[];
  // For FLAT_SELECTED_CATEGORIES
  categoryIds?: number[];
  subCategoryIds?: number[];
}
```

**Response:**
```typescript
interface DiscountResponseDto {
  id: number;
  name: string;
  description: string;
  discountType: DiscountType;
  valueType: DiscountValueType;
  discountValue: number;
  discountScope: DiscountScope;
  startDate: string;
  endDate: string;
  isActive: boolean;
  maxUsageCount: number | null;
  minOrderValue: number | null;
  voucherCode: string | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}
```

#### 2. Get All Discounts
```http
GET /discounts?isActive=true&discountType=FLAT_ALL_PRODUCTS
```

**Query Parameters:**
- `isActive` (optional): Filter by active status
- `discountType` (optional): Filter by type

**Response:** Array of DiscountResponseDto

#### 3. Get Single Discount
```http
GET /discounts/:id
```

**Response:** DiscountResponseDto

#### 4. Update Discount
```http
PATCH /discounts/:id
```

**Request Body:** Partial CreateDiscountDto

#### 5. Delete Discount
```http
DELETE /discounts/:id
```

#### 6. Toggle Discount Active Status
```http
POST /discounts/:id/toggle-active
```

**Response:** Updated DiscountResponseDto

#### 7. Calculate Discounts (Preview)
```http
POST /discounts/calculate
```

**Request Body:**
```typescript
interface CalculateDiscountDto {
  orderItems: Array<{
    productId: number;
    quantity?: number; // Default: 1
    unitPrice?: number; // Default: 0
  }>;
  orderSubtotal?: number; // Optional: if provided, use this instead of calculating
  voucherCode?: string; // Optional voucher code to apply
}
```

**Response:**
```typescript
interface DiscountCalculationResult {
  orderDiscount: number; // Total order-level discount
  lineItemDiscounts: Array<{
    productId: number;
    discountAmount: number;
    appliedDiscountId?: number;
    discountType?: string;
  }>;
  appliedDiscounts: Discount[]; // Array of applied discount objects
  discountBreakdown: string; // Human-readable breakdown
  subtotalBeforeDiscount: number;
  subtotalAfterDiscount: number;
  finalTotal: number;
}
```

**Use Case:** Call this endpoint before creating an order to preview discount calculations and show users the final price.

---

## Order Processing Workflow

### Complete Order Lifecycle

```
1. PLACED (Initial State)
   ↓
2. CONFIRMED (After payment verification)
   ↓
3. PROCESSING (Preparing items)
   ↓
4. SHIPPING (Out for delivery)
   ↓
5. DELIVERED (Order completed)
   
   OR
   
   CANCELED (At any point before DELIVERED)
```

### Detailed Workflow Steps

#### Step 1: Create Order (PLACED)

**Frontend Action:**
```typescript
const orderData = {
  customer: {
    name: "John Doe",
    email: "john@example.com",
    phoneNumber: "9751234567",
    shippingAddress: "123 Main St"
  },
  orderItems: [
    {
      productId: 1,
      quantity: 2,
      unitPrice: 1000
    },
    {
      productId: 2,
      quantity: 1,
      unitPrice: 500
    }
  ],
  orderType: "ONLINE",
  voucherCode: "SAVE10", // Optional
  shippingCost: 100
};

const order = await createOrder(orderData);
```

**Backend Processing:**
1. Finds or creates customer based on email/phone/name
2. Validates all products exist and are available
3. Calculates discounts automatically:
   - Checks for active discounts matching voucher code (if provided)
   - Applies discounts based on discount rules
   - Calculates line item discounts and order-level discounts
4. Calculates totals:
   - Subtotal = sum of (quantity × unitPrice - lineItemDiscount) for each item
   - Order discount applied to subtotal
   - Total = subtotal - orderDiscount + shippingCost
5. Generates order number (format: ORD-YYYY-XXXX)
6. Sets initial status:
   - `fulfillmentStatus`: PLACED
   - `paymentStatus`: PENDING (or PAID if COUNTER order with payment method)
7. Creates order items with calculated discounts
8. Tracks applied discounts in `orderDiscounts` table
9. Triggers SMS notification (ORDER_PLACED event)

**Response:**
```typescript
{
  id: 1,
  orderNumber: "ORD-2024-0001",
  fulfillmentStatus: "PLACED",
  paymentStatus: "PENDING",
  totalAmount: 2400, // After discounts
  orderDiscount: 100,
  // ... other fields
}
```

#### Step 2: Process Payment

**Option A: Online Payment (MBOB, BDB_EPAY, TPAY, BNB_MPAY)**
```typescript
// After payment gateway confirms payment
const paymentResult = await processPayment(orderId, {
  paymentMethod: "MBOB",
  paymentDate: new Date().toISOString()
});
```

**Option B: Cash on Delivery**
```typescript
// Set payment method, payment processed on delivery
await updatePaymentStatus(orderId, {
  paymentStatus: "PENDING",
  paymentMethod: "CASH"
});
```

**Option C: Counter Payment (ZPSS)**
```typescript
// ZPSS automatically sets payment to PAID
await updatePaymentMethod(orderId, {
  paymentMethod: "ZPSS"
});
// Payment status automatically becomes PAID
```

**Backend Processing:**
1. Validates order is in PLACED or CONFIRMED status
2. Updates payment status to PAID
3. Auto-updates fulfillment status to CONFIRMED if currently PLACED
4. Generates receipt number (format: RCP-YYYY-XXXX)
5. Creates accounting entries (double-entry bookkeeping)
6. Triggers SMS notification (PAYMENT_RECEIVED event)

#### Step 3: Verify Order (If Required)

**Note:** Only required for non-ZPSS payment methods that need manual verification.

```typescript
await verifyOrder(orderId, {
  internalNotes: "Payment verified via bank statement"
});
```

**Backend Processing:**
1. Checks payment method requires verification
2. Sets payment status to PAID
3. Generates receipt
4. Creates accounting entries
5. Triggers SMS notification

#### Step 4: Update Fulfillment Status

**4a. Confirm Order**
```typescript
await updateFulfillmentStatus(orderId, {
  fulfillmentStatus: "CONFIRMED"
});
```

**4b. Start Processing**
```typescript
await updateFulfillmentStatus(orderId, {
  fulfillmentStatus: "PROCESSING"
});
```

**4c. Ship Order**
```typescript
await updateFulfillmentStatus(orderId, {
  fulfillmentStatus: "SHIPPING",
  driverName: "Tenzin Dorji",
  driverPhone: "9751234567",
  vehicleNumber: "BT-1234"
});
```

**Backend Processing:**
- Updates fulfillment status
- Sets appropriate timestamp (confirmedAt, processingAt, shippingAt)
- Stores driver information for SHIPPING status
- Triggers SMS notification based on status change

#### Step 5: Mark as Delivered
```typescript
await markOrderAsDelivered(orderId);
```

**Backend Processing:**
1. Validates order is in SHIPPING status
2. Updates fulfillment status to DELIVERED
3. Sets `deliveredAt` timestamp
4. Generates `feedbackToken` (UUID)
5. Increments product sales counts
6. Triggers SMS notification with feedback link

**Response includes:**
```typescript
{
  fulfillmentStatus: "DELIVERED",
  deliveredAt: "2024-01-15T10:30:00Z",
  feedbackToken: "uuid-here"
}
```

#### Step 6: Cancel Order (If Needed)
```typescript
await cancelOrder(orderId, {
  reason: "Customer requested cancellation"
});
```

**Backend Processing:**
1. Updates fulfillment status to CANCELED
2. Updates payment status to FAILED
3. Sets `canceledAt` timestamp
4. If order was delivered, creates reversal accounting entries
5. Triggers SMS notification (if configured)

---

## Discount Application System

### Discount Types

#### 1. FLAT_ALL_PRODUCTS
Applies discount to all products in the order.

**Example:**
```typescript
{
  name: "10% Off Everything",
  discountType: "FLAT_ALL_PRODUCTS",
  valueType: "PERCENTAGE",
  discountValue: 10,
  discountScope: "PER_PRODUCT", // or "ORDER_TOTAL"
  startDate: "2024-01-01",
  endDate: "2024-12-31",
  isActive: true
}
```

#### 2. FLAT_SELECTED_PRODUCTS
Applies discount only to specific products.

**Example:**
```typescript
{
  name: "Product Sale",
  discountType: "FLAT_SELECTED_PRODUCTS",
  valueType: "FIXED_AMOUNT",
  discountValue: 50,
  discountScope: "PER_PRODUCT",
  productIds: [1, 2, 3], // Specific product IDs
  startDate: "2024-01-01",
  endDate: "2024-12-31"
}
```

#### 3. FLAT_SELECTED_CATEGORIES
Applies discount to products in specific categories or subcategories.

**Example:**
```typescript
{
  name: "Category Discount",
  discountType: "FLAT_SELECTED_CATEGORIES",
  valueType: "PERCENTAGE",
  discountValue: 15,
  discountScope: "PER_PRODUCT",
  categoryIds: [1, 2], // Category IDs
  subCategoryIds: [5, 6], // Subcategory IDs
  startDate: "2024-01-01",
  endDate: "2024-12-31"
}
```

### Discount Scope

#### PER_PRODUCT
Discount is applied to each product line item individually.

**Calculation:**
```
Line Item Discount = (unitPrice × quantity) × (discountValue / 100) // for percentage
OR
Line Item Discount = discountValue // for fixed amount
```

#### ORDER_TOTAL
Discount is applied to the entire order subtotal.

**Calculation:**
```
Order Discount = subtotal × (discountValue / 100) // for percentage
OR
Order Discount = discountValue // for fixed amount
```

### Discount Calculation Flow

#### Step 1: Preview Discounts (Before Order Creation)

```typescript
const previewDiscounts = async (orderItems, voucherCode) => {
  const response = await fetch(`${API_BASE_URL}/discounts/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      orderItems: orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })),
      voucherCode: voucherCode
    })
  });
  
  return response.json();
};

// Usage
const discountPreview = await previewDiscounts([
  { productId: 1, quantity: 2, unitPrice: 1000 },
  { productId: 2, quantity: 1, unitPrice: 500 }
], "SAVE10");

console.log(discountPreview);
// {
//   orderDiscount: 100,
//   lineItemDiscounts: [
//     { productId: 1, discountAmount: 50 },
//     { productId: 2, discountAmount: 25 }
//   ],
//   subtotalBeforeDiscount: 2500,
//   subtotalAfterDiscount: 2325,
//   finalTotal: 2325
// }
```

#### Step 2: Backend Calculation Process

When creating an order, the backend automatically:

1. **Loads Active Discounts**
   - Filters by `isActive = true`
   - Checks date range (startDate ≤ now ≤ endDate)
   - Filters by voucher code (if provided)
   - Filters by minimum order value
   - Filters by usage limits

2. **Matches Discounts to Products**
   - For `FLAT_ALL_PRODUCTS`: Applies to all products
   - For `FLAT_SELECTED_PRODUCTS`: Matches product IDs
   - For `FLAT_SELECTED_CATEGORIES`: Matches product categories/subcategories

3. **Calculates Discounts**
   - Applies line item discounts (PER_PRODUCT scope)
   - Applies order-level discounts (ORDER_TOTAL scope)
   - Prevents double discounting (each product gets discount from first matching discount)

4. **Calculates Totals**
   ```
   For each item:
     lineSubtotal = (unitPrice × quantity) - lineItemDiscount
   
   subtotal = sum of all lineSubtotals
   orderDiscount = sum of all order-level discounts
   total = subtotal - orderDiscount + shippingCost
   ```

5. **Tracks Applied Discounts**
   - Creates `OrderDiscount` records for each applied discount
   - Stores discount amount, name, type, and voucher code

### Discount Rules and Constraints

1. **Voucher Code Matching**
   - If voucher code provided: Only discounts with matching code are applied
   - If no voucher code: Only auto-apply discounts (no voucher code) are applied

2. **Minimum Order Value**
   - Discount only applies if order subtotal ≥ `minOrderValue`

3. **Usage Limits**
   - Discount only applies if `usageCount < maxUsageCount`

4. **Date Range**
   - Discount must be active between `startDate` and `endDate`

5. **No Double Discounting**
   - Each product receives discount from the first matching discount only
   - Subsequent matching discounts are skipped for that product

### Example: Complete Discount Application

**Scenario:**
- Product 1: $1000, quantity 2
- Product 2: $500, quantity 1
- Shipping: $100
- Voucher Code: "SAVE10"

**Active Discounts:**
1. "10% Off Everything" (FLAT_ALL_PRODUCTS, PERCENTAGE, 10%, PER_PRODUCT, no voucher)
2. "Save $10" (FLAT_ALL_PRODUCTS, FIXED_AMOUNT, $10, ORDER_TOTAL, voucher: "SAVE10")

**Calculation:**
```
Step 1: Calculate line item discounts
  Product 1: (1000 × 2) × 10% = $200 discount
  Product 2: (500 × 1) × 10% = $50 discount
  Total line item discount: $250

Step 2: Calculate subtotal after line discounts
  Product 1: (1000 × 2) - 200 = $1800
  Product 2: (500 × 1) - 50 = $450
  Subtotal: $2250

Step 3: Apply order-level discount
  Order discount: $10 (from "Save $10" discount)
  Subtotal after order discount: $2250 - $10 = $2240

Step 4: Add shipping
  Final total: $2240 + $100 = $2340
```

**Result:**
```typescript
{
  orderDiscount: 10,
  lineItemDiscounts: [
    { productId: 1, discountAmount: 200 },
    { productId: 2, discountAmount: 50 }
  ],
  subtotalBeforeDiscount: 2500,
  subtotalAfterDiscount: 2240,
  finalTotal: 2340
}
```

---

## Integration Examples

### Example 1: Complete Order Flow with Discount Preview

```typescript
// 1. User adds products to cart
const cartItems = [
  { productId: 1, quantity: 2, unitPrice: 1000 },
  { productId: 2, quantity: 1, unitPrice: 500 }
];

// 2. Preview discounts before checkout
const discountPreview = await previewDiscounts(cartItems, "SAVE10");

// 3. Display to user
console.log(`Subtotal: $${discountPreview.subtotalBeforeDiscount}`);
console.log(`Discounts: $${discountPreview.orderDiscount + discountPreview.lineItemDiscounts.reduce((sum, item) => sum + item.discountAmount, 0)}`);
console.log(`Total: $${discountPreview.finalTotal}`);

// 4. User confirms order
const order = await createOrder({
  customer: {
    name: "John Doe",
    email: "john@example.com",
    phoneNumber: "9751234567"
  },
  orderItems: cartItems,
  voucherCode: "SAVE10",
  shippingCost: 100,
  orderType: "ONLINE"
});

// 5. Process payment
const paidOrder = await processPayment(order.id, {
  paymentMethod: "MBOB"
});

// 6. Track order status
const orderStatus = await getCustomerStatus(order.id);
console.log(orderStatus.customerStatusMessage);
```

### Example 2: Order Tracking Page

```typescript
const trackOrder = async (orderNumber: string) => {
  const order = await fetch(`${API_BASE_URL}/orders/track?orderNumber=${orderNumber}`);
  return order.json();
};

// Or by phone number (returns all orders)
const trackByPhone = async (phoneNumber: string) => {
  const orders = await fetch(`${API_BASE_URL}/orders/track?phoneNumber=${phoneNumber}`);
  return orders.json();
};
```

### Example 3: Admin Order Management

```typescript
// Get all orders for a month
const monthlyOrders = await fetch(
  `${API_BASE_URL}/orders/by-month?year=2024&month=1`
);

// Get statistics
const statistics = await fetch(
  `${API_BASE_URL}/orders/statistics/by-month?year=2024&month=1`
);

// Update order status
const updateStatus = async (orderId: number, status: string) => {
  if (status === "SHIPPING") {
    return await updateFulfillmentStatus(orderId, {
      fulfillmentStatus: "SHIPPING",
      driverName: "Driver Name",
      driverPhone: "9751234567",
      vehicleNumber: "BT-1234"
    });
  } else {
    return await updateFulfillmentStatus(orderId, {
      fulfillmentStatus: status
    });
  }
};
```

### Example 4: Product Catalog with Discounts

```typescript
// Get all products
const products = await fetch(`${API_BASE_URL}/products`);

// For each product, preview discount
const productsWithDiscounts = await Promise.all(
  products.map(async (product) => {
    const discountPreview = await previewDiscounts([
      { productId: product.id, quantity: 1, unitPrice: product.price }
    ]);
    
    return {
      ...product,
      originalPrice: product.price,
      discountedPrice: discountPreview.finalTotal,
      discount: discountPreview.lineItemDiscounts[0]?.discountAmount || 0
    };
  })
);
```

### Example 5: Create Discount

```typescript
const createDiscount = async () => {
  const discount = await fetch(`${API_BASE_URL}/discounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: "Summer Sale 2024",
      description: "20% off all products",
      discountType: "FLAT_ALL_PRODUCTS",
      valueType: "PERCENTAGE",
      discountValue: 20,
      discountScope: "PER_PRODUCT",
      startDate: "2024-06-01T00:00:00Z",
      endDate: "2024-08-31T23:59:59Z",
      isActive: true,
      minOrderValue: 1000 // Minimum order of $10
    })
  });
  
  return discount.json();
};
```

---

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "statusCode": 400,
  "message": "Order must have at least one item",
  "error": "Bad Request"
}
```

**404 Not Found**
```json
{
  "statusCode": 404,
  "message": "Order with ID 123 not found",
  "error": "Not Found"
}
```

**401 Unauthorized**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### Frontend Error Handling Example

```typescript
const handleApiError = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'An error occurred');
  }
  return response.json();
};

try {
  const order = await createOrder(orderData);
} catch (error) {
  console.error('Order creation failed:', error.message);
  // Show user-friendly error message
}
```

---

## TypeScript Type Definitions

```typescript
// Order Types
type FulfillmentStatus = 'PLACED' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELED';
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';
type PaymentMethod = 'CASH' | 'MBOB' | 'BDB_EPAY' | 'TPAY' | 'BNB_MPAY' | 'ZPSS';
type OrderType = 'ONLINE' | 'COUNTER';

// Discount Types
type DiscountType = 'FLAT_ALL_PRODUCTS' | 'FLAT_SELECTED_PRODUCTS' | 'FLAT_SELECTED_CATEGORIES';
type DiscountValueType = 'PERCENTAGE' | 'FIXED_AMOUNT';
type DiscountScope = 'PER_PRODUCT' | 'ORDER_TOTAL';

// Interfaces
interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  orderDate: string;
  orderType: OrderType;
  totalAmount: number;
  orderDiscount: number;
  voucherCode: string | null;
  fulfillmentStatus: FulfillmentStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  shippingCost: number;
  receiptNumber: string | null;
  customer: Customer;
  orderItems: OrderItem[];
  orderDiscounts: OrderDiscount[];
}

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  discountApplied: number;
  lineTotal: number;
  product: Product;
}

interface Discount {
  id: number;
  name: string;
  description: string;
  discountType: DiscountType;
  valueType: DiscountValueType;
  discountValue: number;
  discountScope: DiscountScope;
  startDate: string;
  endDate: string;
  isActive: boolean;
  maxUsageCount: number | null;
  minOrderValue: number | null;
  voucherCode: string | null;
  usageCount: number;
}
```

---

## Best Practices

1. **Always Preview Discounts Before Order Creation**
   - Use `/discounts/calculate` endpoint to show users final price
   - Display discount breakdown to users

2. **Handle Status Transitions Properly**
   - Validate status transitions on frontend
   - Show appropriate UI based on order status
   - Handle errors gracefully

3. **Track Order Status**
   - Poll order status or use WebSockets for real-time updates
   - Display customer-friendly status messages

4. **Error Handling**
   - Always handle API errors
   - Show user-friendly error messages
   - Log errors for debugging

5. **Payment Processing**
   - Verify payment before updating status
   - Handle payment gateway callbacks properly
   - Store transaction IDs for reference

6. **Discount Management**
   - Validate discount codes before applying
   - Show discount preview to users
   - Handle expired or invalid discounts gracefully

---

## Testing Endpoints

### Using cURL

```bash
# Create Order
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "name": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "9751234567"
    },
    "orderItems": [
      {
        "productId": 1,
        "quantity": 2,
        "unitPrice": 1000
      }
    ],
    "voucherCode": "SAVE10"
  }'

# Preview Discounts
curl -X POST http://localhost:3000/discounts/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "orderItems": [
      {
        "productId": 1,
        "quantity": 2,
        "unitPrice": 1000
      }
    ],
    "voucherCode": "SAVE10"
  }'
```

---

## Support

For questions or issues, please refer to:
- Backend API documentation
- Order workflow documentation: `ORDER_PLACEMENT_WORKFLOW.md`
- Customer API documentation: `CUSTOMER_API_DOCUMENTATION.md`

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0

