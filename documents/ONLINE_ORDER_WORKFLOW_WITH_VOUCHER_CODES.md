# Online Order Workflow with Voucher Code Implementation

## Table of Contents
1. [Overview](#overview)
2. [Voucher Code Types](#voucher-code-types)
3. [Order Creation with Voucher Code](#order-creation-with-voucher-code)
4. [Voucher Code Processing Flow](#voucher-code-processing-flow)
5. [Affiliate Marketer Voucher Code Linking](#affiliate-marketer-voucher-code-linking)
6. [Discount Calculation with Voucher Codes](#discount-calculation-with-voucher-codes)
7. [API Endpoints](#api-endpoints)
8. [Complete Workflow Example](#complete-workflow-example)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)

---

## Overview

The online order workflow supports **voucher codes** that can serve two purposes:

1. **Discount Voucher Codes**: Apply discounts to orders (product-level, category-level, or order-level)
2. **Affiliate Marketer Voucher Codes**: Link orders to affiliate marketers for commission tracking

A single voucher code can be both a discount code AND an affiliate marketer code, providing both benefits simultaneously.

### Key Features
- ✅ Voucher code validation during order creation
- ✅ Automatic discount calculation based on voucher code
- ✅ Automatic affiliate marketer linking via voucher code
- ✅ Commission tracking for affiliate marketers
- ✅ Case-insensitive voucher code matching
- ✅ Voucher code updates on existing orders
- ✅ Support for both discount and affiliate vouchers

---

## Voucher Code Types

### 1. Discount Voucher Codes

Discount voucher codes are stored in the `discounts` table and can apply:
- **Product-level discounts**: Discounts on specific products
- **Category-level discounts**: Discounts on product categories/subcategories
- **Order-level discounts**: Discounts on the entire order total

**Discount Properties**:
- `voucherCode`: Unique code string (e.g., "SAVE10", "WELCOME2025")
- `isActive`: Whether the discount is currently active
- `startDate` / `endDate`: Validity period
- `minOrderValue`: Minimum order value required
- `maxUsageCount`: Maximum number of times the code can be used
- `priority`: Order of application when multiple discounts apply

### 2. Affiliate Marketer Voucher Codes

Affiliate marketer voucher codes are stored in the `users` table (where `role = 'AFFILIATE_MARKETER'`):
- `voucherCode`: Unique code assigned to the affiliate marketer
- `discountPercentage`: Discount percentage the affiliate can offer to customers
- `commissionPercentage`: Commission percentage the affiliate earns on orders
- `isActive`: Whether the affiliate marketer account is active

**Example Affiliate Marketer**:
```json
{
  "id": 5,
  "name": "John Affiliate",
  "voucherCode": "JOHN2025",
  "discountPercentage": 10.00,
  "commissionPercentage": 5.00,
  "isActive": true,
  "role": "AFFILIATE_MARKETER"
}
```

### 3. Combined Voucher Codes

A voucher code can be both:
- A discount code (exists in `discounts` table)
- An affiliate marketer code (exists in `users` table with `role = 'AFFILIATE_MARKETER'`)

When both exist, the order will:
1. Apply the discount(s) associated with the code
2. Link the order to the affiliate marketer
3. Create a commission record for the affiliate

---

## Order Creation with Voucher Code

### API Endpoint

**POST** `/orders`

### Request Body

```json
{
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+97517123456",
    "address": "Thimphu, Bhutan"
  },
  "orderItems": [
    {
      "productId": 1,
      "quantity": 2,
      "unitPrice": 1000.00
    },
    {
      "productId": 2,
      "quantity": 1,
      "unitPrice": 500.00
    }
  ],
  "orderType": "ONLINE",
  "voucherCode": "JOHN2025",
  "shippingCost": 100.00,
  "internalNotes": "Customer requested express delivery"
}
```

### Key Fields

- **`voucherCode`** (optional): The voucher code entered by the user
  - Can be a discount code, affiliate code, or both
  - Case-insensitive (automatically normalized to uppercase)
  - Trimmed of whitespace

---

## Voucher Code Processing Flow

### Step-by-Step Process

```
1. Order Creation Request
   └─► POST /orders with voucherCode: "JOHN2025"
       │
       ▼
2. OrderService.createOrder()
   └─► Start database transaction
       │
       ├─► Validate customer details
       │
       ├─► Validate products and quantities
       │
       ├─► Process Voucher Code (if provided)
       │   │
       │   ├─► Discount Calculation
       │   │   └─► DiscountCalculationService.calculateOrderDiscounts()
       │   │       ├─► Find discounts matching voucher code
       │   │       ├─► Filter by validity (dates, usage limits)
       │   │       ├─► Filter by minimum order value
       │   │       ├─► Sort by priority
       │   │       └─► Apply discounts to line items and order total
       │   │
       │   └─► Affiliate Marketer Linking
       │       └─► linkAffiliateMarketerByVoucherCode()
       │           ├─► Search users table for voucher code
       │           ├─► Filter: role = 'AFFILIATE_MARKETER'
       │           ├─► Filter: isActive = true
       │           └─► Return affiliateId and commissionPercentage
       │
       ├─► Calculate Order Totals
       │   ├─► Subtotal (after line item discounts)
       │   ├─► Order discount (from voucher code)
       │   ├─► Shipping cost
       │   └─► Final total = subtotal - orderDiscount + shippingCost
       │
       ├─► Create Order Record
       │   ├─► Set voucherCode field
       │   ├─► Set affiliateId (if affiliate found)
       │   └─► Set all calculated totals
       │
       ├─► Create Order Items
       │
       ├─► Create Order Discount Records
       │   └─► Track which discounts were applied
       │
       ├─► Create Affiliate Commission Record (if applicable)
       │   ├─► Calculate commission: (orderTotalBeforeDiscount × commissionPercentage) / 100
       │   ├─► Store affiliateId, orderId, commissionAmount
       │   └─► Set paymentStatus for commission tracking
       │
       └─► Commit Transaction
```

### Detailed Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Order Creation Request                    │
│              POST /orders { voucherCode: "JOHN2025" }       │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              OrderService.createOrder()                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. Start Database Transaction                         │  │
│  │ 2. Validate Customer & Products                       │  │
│  │ 3. Process Voucher Code                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────┬──────────────────────┬───────────────────────────────┘
      │                      │
      ▼                      ▼
┌──────────────┐    ┌──────────────────────────────┐
│ Discount     │    │ Affiliate Marketer           │
│ Calculation  │    │ Linking                      │
└──────┬───────┘    └──────┬───────────────────────┘
       │                   │
       ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│ DiscountCalculationService.calculateOrderDiscounts()         │
│  • Find discounts with voucherCode = "JOHN2025"               │
│  • Filter by validity dates                                  │
│  • Filter by minimum order value                             │
│  • Filter by usage limits                                    │
│  • Sort by priority                                          │
│  • Apply discounts to line items                             │
│  • Apply discounts to order total                            │
│  • Return: orderDiscount, lineItemDiscounts[]                │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ linkAffiliateMarketerByVoucherCode("JOHN2025")              │
│  • Query users table:                                        │
│    WHERE voucherCode = "JOHN2025"                           │
│      AND role = 'AFFILIATE_MARKETER'                        │
│      AND isActive = true                                     │
│  • Return: { affiliateId: 5, commissionPercentage: 5.0 }   │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ Calculate Order Totals                                       │
│  • Subtotal = sum(lineItems.lineTotal)                      │
│  • Order Discount = discountResult.orderDiscount            │
│  • Shipping Cost = 100.00                                   │
│  • Final Total = subtotal - orderDiscount + shippingCost    │
│  • Order Total Before Discount (for commission)              │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ Create Order Record                                          │
│  • orderNumber: "ORD-2025-0001"                             │
│  • voucherCode: "JOHN2025"                                  │
│  • affiliateId: 5 (if affiliate found)                     │
│  • totalAmount: calculated total                             │
│  • orderDiscount: calculated discount                       │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ Create Affiliate Commission Record (if affiliateId exists)   │
│  • affiliateId: 5                                           │
│  • orderId: 123                                              │
│  • orderTotal: orderTotalBeforeDiscount                      │
│  • commissionAmount: (orderTotal × 5%) / 100                │
│  • commissionPercentage: 5.0                                 │
│  • paymentStatus: PENDING (matches order payment status)     │
└─────────────────────────────────────────────────────────────┘
```

---

## Affiliate Marketer Voucher Code Linking

### How It Works

When a voucher code matches an active affiliate marketer:

1. **Automatic Linking**: The order's `affiliateId` field is automatically set
2. **Commission Calculation**: A commission record is created in `affiliate_commissions` table
3. **Commission Tracking**: Commission is calculated based on order total **before discounts**

### Linking Logic

```typescript
// Helper method: linkAffiliateMarketerByVoucherCode()
private async linkAffiliateMarketerByVoucherCode(
  voucherCode: string,
  transaction?: any,
): Promise<{ affiliateId: number; commissionPercentage: number } | null> {
  // 1. Normalize voucher code (trim, uppercase)
  const normalizedCode = voucherCode.trim().toUpperCase();
  
  // 2. Find active affiliate marketer
  const affiliate = await this.userModel.findOne({
    where: {
      voucherCode: normalizedCode,
      role: UserRole.AFFILIATE_MARKETER,
      isActive: true, // Only link to active affiliates
    },
    transaction,
  });
  
  // 3. Return affiliate info or null
  if (affiliate) {
    return {
      affiliateId: affiliate.id,
      commissionPercentage: parseFloat(affiliate.commissionPercentage.toString()),
    };
  }
  
  return null;
}
```

### Commission Calculation

**Formula**:
```
Commission Amount = (Order Total Before Discount × Commission Percentage) / 100
```

**Example**:
- Order Total Before Discount: Nu. 2,500.00
- Commission Percentage: 5%
- Commission Amount: (2,500 × 5) / 100 = Nu. 125.00

**Important**: Commission is calculated on the order total **before discounts** are applied. This ensures affiliates earn commission on the full order value, not the discounted amount.

### Commission Record Structure

```json
{
  "id": 1,
  "affiliateId": 5,
  "orderId": 123,
  "orderTotal": 2500.00,
  "commissionAmount": 125.00,
  "commissionPercentage": 5.00,
  "orderDate": "2025-01-20T10:00:00Z",
  "paymentStatus": "PENDING"
}
```

### Commission Status Tracking

The commission's `paymentStatus` field tracks when the affiliate should be paid:
- **PENDING**: Order payment is pending, commission not yet payable
- **PAID**: Order payment received, commission is payable
- **FAILED**: Order payment failed, commission not payable

---

## Discount Calculation with Voucher Codes

### Discount Lookup Process

1. **Find Discounts by Voucher Code**
   ```sql
   SELECT * FROM discounts
   WHERE voucherCode = 'JOHN2025'
     AND isActive = true
     AND (startDate IS NULL OR startDate <= NOW())
     AND (endDate IS NULL OR endDate >= NOW())
   ```

2. **Filter by Minimum Order Value**
   ```sql
   WHERE minOrderValue IS NULL OR minOrderValue <= orderSubtotal
   ```

3. **Filter by Usage Limits**
   ```sql
   WHERE maxUsageCount IS NULL OR usageCount < maxUsageCount
   ```

4. **Sort by Priority** (higher priority applied first)

5. **Apply Discounts**
   - Line item discounts applied to matching products
   - Order-level discounts applied to order total
   - Products already discounted are skipped (higher priority wins)

### Discount Types Supported

#### 1. Product-Level Discounts
- **Type**: `FLAT_SELECTED_PRODUCTS`
- **Scope**: `LINE_ITEM`
- **Applies to**: Specific products linked to the discount

#### 2. Category-Level Discounts
- **Type**: `FLAT_SELECTED_CATEGORIES`
- **Scope**: `LINE_ITEM` or `ORDER_TOTAL`
- **Applies to**: Products in specific categories/subcategories

#### 3. Order-Level Discounts
- **Type**: `FLAT_ALL_PRODUCTS`
- **Scope**: `ORDER_TOTAL`
- **Applies to**: Entire order total

### Discount Value Types

1. **Percentage Discount**
   - Example: 10% off
   - Calculation: `(amount × 10) / 100`

2. **Fixed Amount Discount**
   - Example: Nu. 100 off
   - Calculation: Direct subtraction

### Example Discount Calculation

**Order**:
- Product A (2 × Nu. 1,000) = Nu. 2,000
- Product B (1 × Nu. 500) = Nu. 500
- Subtotal: Nu. 2,500
- Shipping: Nu. 100

**Voucher Code**: "JOHN2025"

**Active Discounts**:
1. "10% off all products" (Priority: 10, LINE_ITEM, voucherCode: "JOHN2025")
2. "Nu. 50 off orders over Nu. 2,000" (Priority: 1, ORDER_TOTAL, voucherCode: "JOHN2025")

**Calculation**:
1. Apply "10% off all products":
   - Product A discount: Nu. 200 (10% of 2,000)
   - Product B discount: Nu. 50 (10% of 500)
   - Line item discounts: Nu. 250

2. Apply "Nu. 50 off orders over Nu. 2,000":
   - Order discount: Nu. 50

**Result**:
- Subtotal after line item discounts: Nu. 2,250
- Order discount: Nu. 50
- Final total: Nu. 2,250 - Nu. 50 + Nu. 100 = Nu. 2,300

---

## API Endpoints

### 1. Create Order with Voucher Code

**Endpoint**: `POST /orders`

**Request**:
```json
{
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+97517123456"
  },
  "orderItems": [
    {
      "productId": 1,
      "quantity": 2,
      "unitPrice": 1000.00
    }
  ],
  "voucherCode": "JOHN2025",
  "shippingCost": 100.00
}
```

**Response**:
```json
{
  "id": 123,
  "orderNumber": "ORD-2025-0001",
  "customerId": 45,
  "orderDate": "2025-01-20T10:00:00Z",
  "orderType": "ONLINE",
  "totalAmount": 2300.00,
  "orderDiscount": 50.00,
  "voucherCode": "JOHN2025",
  "affiliateId": 5,
  "fulfillmentStatus": "PLACED",
  "paymentStatus": "PENDING",
  "shippingCost": 100.00,
  "customer": {
    "id": 45,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "orderItems": [
    {
      "id": 1,
      "productId": 1,
      "quantity": 2,
      "unitPrice": 1000.00,
      "discountApplied": 200.00,
      "lineTotal": 1800.00
    }
  ],
  "affiliate": {
    "id": 5,
    "name": "John Affiliate",
    "voucherCode": "JOHN2025"
  }
}
```

### 2. Update Order Voucher Code

**Endpoint**: `PATCH /orders/:id`

**Request**:
```json
{
  "voucherCode": "NEWCODE2025"
}
```

**What Happens**:
1. System checks if new voucher code belongs to an affiliate marketer
2. If found, updates order's `affiliateId`
3. Creates or updates affiliate commission record
4. Recalculates commission based on current order total

**Response**:
```json
{
  "id": 123,
  "voucherCode": "NEWCODE2025",
  "affiliateId": 6,
  // ... other order fields
}
```

### 3. Get Order with Affiliate Information

**Endpoint**: `GET /orders/:id`

**Response** (includes affiliate info if linked):
```json
{
  "id": 123,
  "orderNumber": "ORD-2025-0001",
  "voucherCode": "JOHN2025",
  "affiliateId": 5,
  "affiliate": {
    "id": 5,
    "name": "John Affiliate",
    "voucherCode": "JOHN2025",
    "commissionPercentage": 5.00
  },
  "affiliateCommissions": [
    {
      "id": 1,
      "affiliateId": 5,
      "orderId": 123,
      "orderTotal": 2500.00,
      "commissionAmount": 125.00,
      "commissionPercentage": 5.00,
      "paymentStatus": "PENDING"
    }
  ]
}
```

---

## Complete Workflow Example

### Scenario: Customer Places Order with Affiliate Voucher Code

**Step 1: Customer Enters Voucher Code**
```
Customer visits website → Adds products to cart → Enters voucher code "JOHN2025" → Clicks "Place Order"
```

**Step 2: Order Creation Request**
```http
POST /orders
Content-Type: application/json

{
  "customer": {
    "name": "Jane Customer",
    "email": "jane@example.com",
    "phoneNumber": "+97517987654"
  },
  "orderItems": [
    {
      "productId": 1,
      "quantity": 2,
      "unitPrice": 1000.00
    },
    {
      "productId": 2,
      "quantity": 1,
      "unitPrice": 500.00
    }
  ],
  "voucherCode": "JOHN2025",
  "shippingCost": 100.00,
  "orderType": "ONLINE"
}
```

**Step 3: System Processing**

1. **Customer Validation/Creation**
   - System finds or creates customer record
   - Customer ID: 46

2. **Product Validation**
   - Validates Product 1 and Product 2 exist and are available
   - All products valid ✓

3. **Voucher Code Processing**

   **a. Discount Lookup**:
   ```sql
   SELECT * FROM discounts
   WHERE voucherCode = 'JOHN2025'
     AND isActive = true
   ```
   - Finds discount: "10% off all products" (Priority: 10)
   - Finds discount: "Nu. 50 off orders over Nu. 2,000" (Priority: 1)

   **b. Affiliate Marketer Lookup**:
   ```sql
   SELECT * FROM users
   WHERE voucherCode = 'JOHN2025'
     AND role = 'AFFILIATE_MARKETER'
     AND isActive = true
   ```
   - Finds affiliate: John Affiliate (ID: 5, Commission: 5%)

4. **Discount Calculation**
   - Subtotal before discounts: Nu. 2,500 (2,000 + 500)
   - Apply "10% off all products":
     - Product 1 discount: Nu. 200 (10% of 2,000)
     - Product 2 discount: Nu. 50 (10% of 500)
     - Line item discounts: Nu. 250
   - Subtotal after line item discounts: Nu. 2,250
   - Apply "Nu. 50 off orders over Nu. 2,000":
     - Order discount: Nu. 50
   - Final subtotal: Nu. 2,200
   - Add shipping: Nu. 100
   - **Final total: Nu. 2,300**

5. **Order Creation**
   ```json
   {
     "orderNumber": "ORD-2025-0001",
     "customerId": 46,
     "totalAmount": 2300.00,
     "orderDiscount": 50.00,
     "voucherCode": "JOHN2025",
     "affiliateId": 5,
     "fulfillmentStatus": "PLACED",
     "paymentStatus": "PENDING"
   }
   ```

6. **Order Items Creation**
   - Product 1: quantity 2, unitPrice 1000, discountApplied 200, lineTotal 1800
   - Product 2: quantity 1, unitPrice 500, discountApplied 50, lineTotal 450

7. **Order Discount Records Creation**
   - Record 1: "10% off all products", discountAmount: 250.00
   - Record 2: "Nu. 50 off orders over Nu. 2,000", discountAmount: 50.00

8. **Affiliate Commission Creation**
   ```json
   {
     "affiliateId": 5,
     "orderId": 123,
     "orderTotal": 2500.00,  // Before discounts
     "commissionAmount": 125.00,  // 5% of 2,500
     "commissionPercentage": 5.00,
     "paymentStatus": "PENDING"
   }
   ```

**Step 4: Response**
```json
{
  "id": 123,
  "orderNumber": "ORD-2025-0001",
  "totalAmount": 2300.00,
  "orderDiscount": 50.00,
  "voucherCode": "JOHN2025",
  "affiliateId": 5,
  "customer": { ... },
  "orderItems": [ ... ],
  "affiliate": {
    "id": 5,
    "name": "John Affiliate"
  }
}
```

**Step 5: Commission Tracking**
- Affiliate commission record created
- Commission will be paid when order payment status changes to "PAID"
- Affiliate can view commission in their dashboard

---

## Error Handling

### Invalid Voucher Code

**Scenario**: Voucher code doesn't exist or is inactive

**Behavior**:
- Order creation continues normally
- No discount applied
- No affiliate linking
- No error thrown (voucher code is optional)

**Response**: Order created successfully without discount/affiliate benefits

### Expired Voucher Code

**Scenario**: Voucher code exists but is outside validity period

**Behavior**:
- Discount not applied (filtered out by date check)
- Affiliate linking still works (affiliate codes don't expire)
- Order created successfully

### Voucher Code Usage Limit Exceeded

**Scenario**: Discount voucher code has reached `maxUsageCount`

**Behavior**:
- Discount not applied (filtered out by usage limit check)
- Affiliate linking still works
- Order created successfully

### Inactive Affiliate Marketer

**Scenario**: Voucher code belongs to an inactive affiliate marketer

**Behavior**:
- Affiliate not linked (only active affiliates are linked)
- Discounts still apply if voucher code is also a discount code
- Order created successfully

### Minimum Order Value Not Met

**Scenario**: Order subtotal is less than discount's `minOrderValue`

**Behavior**:
- Discount not applied (filtered out by minimum order value check)
- Affiliate linking still works
- Order created successfully

### Transaction Rollback

**Scenario**: Any error during order creation

**Behavior**:
- Entire transaction rolls back
- No order created
- No commission record created
- No discount records created
- Customer creation rolled back (if new customer)

**Error Response**:
```json
{
  "statusCode": 400,
  "message": "Product with ID 999 not found",
  "error": "Bad Request"
}
```

---

## Best Practices

### 1. Voucher Code Format

**Recommended Format**:
- Uppercase letters and numbers
- 6-20 characters
- No special characters (except hyphens)
- Examples: "JOHN2025", "SAVE10", "WELCOME-2025"

**Why**: System normalizes codes to uppercase, so "john2025" and "JOHN2025" are treated the same.

### 2. Affiliate Marketer Setup

**Before assigning voucher codes to affiliates**:
1. Ensure affiliate marketer account is created
2. Set `isActive = true`
3. Configure `discountPercentage` (discount they can offer)
4. Configure `commissionPercentage` (commission they earn)
5. Assign unique `voucherCode`

**Example**:
```sql
UPDATE users
SET voucherCode = 'JOHN2025',
    discountPercentage = 10.00,
    commissionPercentage = 5.00,
    isActive = true
WHERE id = 5 AND role = 'AFFILIATE_MARKETER';
```

### 3. Discount Configuration

**When creating discounts with voucher codes**:
1. Set `voucherCode` field
2. Set appropriate `priority` (higher = applied first)
3. Set `minOrderValue` if required
4. Set `maxUsageCount` to prevent abuse
5. Set validity dates (`startDate`, `endDate`)

### 4. Testing Voucher Codes

**Before going live**:
1. Test discount calculation with various voucher codes
2. Test affiliate linking
3. Test combined discount + affiliate codes
4. Test invalid/expired codes
5. Test minimum order value requirements
6. Test usage limits

### 5. Monitoring

**Track**:
- Voucher code usage frequency
- Affiliate commission totals
- Discount redemption rates
- Invalid voucher code attempts (for fraud detection)

### 6. Security Considerations

- **Voucher codes are case-insensitive**: "john2025" = "JOHN2025"
- **Only active affiliates are linked**: Prevents linking to deactivated accounts
- **Usage limits prevent abuse**: `maxUsageCount` limits discount usage
- **Transaction safety**: All operations are atomic (all or nothing)

---

## Summary

The online order workflow with voucher codes provides:

1. **Flexible Discount System**: Support for product, category, and order-level discounts
2. **Automatic Affiliate Linking**: Orders automatically linked to affiliate marketers via voucher codes
3. **Commission Tracking**: Automatic commission calculation and tracking
4. **Combined Functionality**: Single voucher code can provide both discounts and affiliate linking
5. **Robust Error Handling**: Graceful handling of invalid/expired codes
6. **Transaction Safety**: All operations are atomic and consistent

**Key Workflow**:
```
Customer enters voucher code
  ↓
System validates and processes code
  ├─► Applies discounts (if discount code)
  └─► Links affiliate (if affiliate code)
  ↓
Order created with discounts and affiliate link
  ↓
Commission record created (if affiliate linked)
  ↓
Order proceeds through normal fulfillment workflow
```

The system ensures that voucher codes enhance the customer experience while automatically tracking affiliate relationships and commissions.

