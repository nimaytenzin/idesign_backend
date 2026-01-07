# Frontend Discount Calculation Service - Usage Guide

This service provides comprehensive discount calculation functionality for the frontend, handling all discount types, value types, scopes, and constraints.

## Features

✅ **Discount Types:**
- `FLAT_ALL_PRODUCTS` - Applies to all products in the order
- `FLAT_SELECTED_PRODUCTS` - Applies to specific products
- `FLAT_SELECTED_CATEGORIES` - Applies to products in selected categories/subcategories

✅ **Value Types:**
- `PERCENTAGE` - Percentage-based discount (e.g., 10% off)
- `FIXED_AMOUNT` - Fixed amount discount (e.g., Nu. 50 off)

✅ **Scopes:**
- `PER_PRODUCT` - Discount applied to each product line item
- `ORDER_TOTAL` - Discount applied to the entire order subtotal

✅ **Constraints Handled:**
- Active/Inactive status
- Date range (startDate, endDate)
- Minimum order value
- Maximum usage count
- Voucher code requirements
- Product/category matching

## Installation

Copy the `discount-calculation-frontend.service.ts` file to your frontend project.

## Basic Usage

```typescript
import { 
  DiscountCalculationService, 
  Discount, 
  OrderItem,
  DiscountCalculationOptions 
} from './discount-calculation-frontend.service';

// Initialize the service
const discountService = new DiscountCalculationService();

// Your discounts array (from API)
const discounts: Discount[] = [
  {
    id: 1,
    name: '10% Off All Products',
    discountType: DiscountType.FLAT_ALL_PRODUCTS,
    valueType: DiscountValueType.PERCENTAGE,
    discountValue: 10,
    discountScope: DiscountScope.PER_PRODUCT,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    isActive: true,
    maxUsageCount: null,
    minOrderValue: null,
    voucherCode: null,
    usageCount: 5,
  },
  // ... more discounts
];

// Your order items
const orderItems: OrderItem[] = [
  {
    productId: 1,
    quantity: 2,
    unitPrice: 100,
    productSubCategoryId: 5,
    productCategoryId: 2,
  },
  {
    productId: 2,
    quantity: 1,
    unitPrice: 200,
    productSubCategoryId: 6,
    productCategoryId: 2,
  },
];

// Calculate discounts
const result = discountService.calculateDiscounts(discounts, orderItems, {
  voucherCode: null, // Optional: provide voucher code if applicable
});

console.log('Final Total:', result.finalTotal);
console.log('Discount Breakdown:', result.discountBreakdown);
```

## Usage Examples

### Example 1: Simple Percentage Discount on All Products

```typescript
const discounts: Discount[] = [
  {
    id: 1,
    name: '10% Off Everything',
    discountType: DiscountType.FLAT_ALL_PRODUCTS,
    valueType: DiscountValueType.PERCENTAGE,
    discountValue: 10,
    discountScope: DiscountScope.PER_PRODUCT,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    isActive: true,
    maxUsageCount: null,
    minOrderValue: null,
    voucherCode: null,
    usageCount: 0,
  },
];

const orderItems: OrderItem[] = [
  { productId: 1, quantity: 2, unitPrice: 100 },
  { productId: 2, quantity: 1, unitPrice: 200 },
];

const result = discountService.calculateDiscounts(discounts, orderItems);

// Result:
// - Subtotal before discount: 400 (100*2 + 200*1)
// - Line item discounts: 40 (10% of 200 + 10% of 200)
// - Final total: 360
```

### Example 2: Fixed Amount Discount with Minimum Order Value

```typescript
const discounts: Discount[] = [
  {
    id: 2,
    name: 'Nu. 50 Off on Orders Above Nu. 500',
    discountType: DiscountType.FLAT_ALL_PRODUCTS,
    valueType: DiscountValueType.FIXED_AMOUNT,
    discountValue: 50,
    discountScope: DiscountScope.ORDER_TOTAL,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    isActive: true,
    maxUsageCount: null,
    minOrderValue: 500, // Minimum order requirement
    voucherCode: null,
    usageCount: 0,
  },
];

const orderItems: OrderItem[] = [
  { productId: 1, quantity: 3, unitPrice: 200 }, // Total: 600
];

const result = discountService.calculateDiscounts(discounts, orderItems);

// Result:
// - Subtotal before discount: 600
// - Order discount: 50 (fixed amount)
// - Final total: 550
```

### Example 3: Discount on Selected Products

```typescript
const discounts: Discount[] = [
  {
    id: 3,
    name: '20% Off Selected Products',
    discountType: DiscountType.FLAT_SELECTED_PRODUCTS,
    valueType: DiscountValueType.PERCENTAGE,
    discountValue: 20,
    discountScope: DiscountScope.PER_PRODUCT,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    isActive: true,
    maxUsageCount: null,
    minOrderValue: null,
    voucherCode: null,
    usageCount: 0,
    productIds: [1, 3], // Only products 1 and 3
  },
];

const orderItems: OrderItem[] = [
  { productId: 1, quantity: 2, unitPrice: 100 }, // Will get discount
  { productId: 2, quantity: 1, unitPrice: 200 }, // No discount
  { productId: 3, quantity: 1, unitPrice: 150 }, // Will get discount
];

const result = discountService.calculateDiscounts(discounts, orderItems);

// Result:
// - Subtotal before discount: 550 (100*2 + 200 + 150)
// - Line item discounts: 70 (20% of 200 + 20% of 150)
// - Final total: 480
```

### Example 4: Discount on Selected Categories

```typescript
const discounts: Discount[] = [
  {
    id: 4,
    name: '15% Off Electronics',
    discountType: DiscountType.FLAT_SELECTED_CATEGORIES,
    valueType: DiscountValueType.PERCENTAGE,
    discountValue: 15,
    discountScope: DiscountScope.PER_PRODUCT,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    isActive: true,
    maxUsageCount: null,
    minOrderValue: null,
    voucherCode: null,
    usageCount: 0,
    categoryIds: [2], // Category ID 2
    subCategoryIds: [5], // Subcategory ID 5
  },
];

const orderItems: OrderItem[] = [
  { 
    productId: 1, 
    quantity: 2, 
    unitPrice: 100,
    productSubCategoryId: 5, // Matches subcategory
    productCategoryId: 2,
  },
  { 
    productId: 2, 
    quantity: 1, 
    unitPrice: 200,
    productCategoryId: 2, // Matches category
  },
  { 
    productId: 3, 
    quantity: 1, 
    unitPrice: 150,
    productCategoryId: 3, // Doesn't match
  },
];

const result = discountService.calculateDiscounts(discounts, orderItems);

// Result:
// - Subtotal before discount: 550
// - Line item discounts: 75 (15% of 200 + 15% of 200)
// - Final total: 475
```

### Example 5: Voucher Code Discount

```typescript
const discounts: Discount[] = [
  {
    id: 5,
    name: 'Special 25% Off',
    discountType: DiscountType.FLAT_ALL_PRODUCTS,
    valueType: DiscountValueType.PERCENTAGE,
    discountValue: 25,
    discountScope: DiscountScope.PER_PRODUCT,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    isActive: true,
    maxUsageCount: 100,
    minOrderValue: 100,
    voucherCode: 'SPECIAL25', // Requires voucher code
    usageCount: 45,
  },
];

const orderItems: OrderItem[] = [
  { productId: 1, quantity: 1, unitPrice: 150 },
];

// Apply with voucher code
const result = discountService.calculateDiscounts(discounts, orderItems, {
  voucherCode: 'SPECIAL25',
});

// Result:
// - Subtotal before discount: 150 (meets minOrderValue)
// - Line item discounts: 37.5 (25% of 150)
// - Final total: 112.5
```

### Example 6: Check if Discount Can Be Applied

```typescript
const discount: Discount = {
  id: 6,
  name: 'Nu. 100 Off',
  discountType: DiscountType.FLAT_ALL_PRODUCTS,
  valueType: DiscountValueType.FIXED_AMOUNT,
  discountValue: 100,
  discountScope: DiscountScope.ORDER_TOTAL,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  isActive: true,
  maxUsageCount: 50,
  minOrderValue: 500,
  voucherCode: null,
  usageCount: 30,
};

// Check if discount can be applied
const check = discountService.canApplyDiscount(discount, 600);

if (check.canApply) {
  console.log('Discount can be applied!');
} else {
  console.log('Cannot apply discount:', check.reason);
}
```

### Example 7: Get Price for Single Product

```typescript
const productId = 1;
const originalPrice = 200; // unitPrice * quantity

const newPrice = discountService.getProductPriceAfterDiscount(
  productId,
  originalPrice,
  discounts,
  orderItems,
  { voucherCode: null }
);

console.log(`Original: Nu. ${originalPrice}, New: Nu. ${newPrice}`);
```

## Result Object Structure

```typescript
interface DiscountCalculationResult {
  orderDiscount: number; // Total discount on order total
  lineItemDiscounts: Array<{
    productId: number;
    discountAmount: number;
    appliedDiscountId?: number;
    discountName?: string;
    originalPrice: number;
    discountedPrice: number;
  }>;
  appliedDiscounts: Discount[]; // Discounts that were actually applied
  discountBreakdown: string[]; // Human-readable breakdown
  subtotalBeforeDiscount: number;
  subtotalAfterDiscount: number;
  finalTotal: number; // Final price after all discounts
  applicableDiscounts: Discount[]; // All discounts that passed checks
  inapplicableDiscounts: Discount[]; // Discounts that didn't pass (for debugging)
}
```

## Important Notes

1. **Product Metadata**: For category-based discounts, ensure your `OrderItem` objects include:
   - `productSubCategoryId` (required for subcategory matching)
   - `productCategoryId` (required for category matching)

2. **Discount Precedence**: Only the first applicable discount is applied to each product to avoid double discounting.

3. **Date Handling**: Ensure dates are properly parsed from strings if coming from API.

4. **Voucher Codes**: 
   - If a discount has a `voucherCode`, it will only be applied when that code is provided.
   - If no voucher code is provided in options, only discounts without voucher codes will be auto-applied.

5. **Minimum Order Value**: This is checked against the subtotal before discounts.

6. **Usage Limits**: The service checks `usageCount < maxUsageCount` to determine if discount can still be used.

## Integration with React/Vue/Angular

### React Example

```typescript
import { useState, useMemo } from 'react';
import { discountCalculationService, Discount, OrderItem } from './discount-calculation-frontend.service';

function CartComponent() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [voucherCode, setVoucherCode] = useState<string>('');

  const calculationResult = useMemo(() => {
    if (discounts.length === 0 || orderItems.length === 0) {
      return null;
    }

    return discountCalculationService.calculateDiscounts(
      discounts,
      orderItems,
      { voucherCode: voucherCode || null }
    );
  }, [discounts, orderItems, voucherCode]);

  return (
    <div>
      {calculationResult && (
        <>
          <p>Subtotal: Nu. {calculationResult.subtotalBeforeDiscount}</p>
          <p>Discount: Nu. {calculationResult.orderDiscount + calculationResult.lineItemDiscounts.reduce((sum, lid) => sum + lid.discountAmount, 0)}</p>
          <p>Total: Nu. {calculationResult.finalTotal}</p>
          
          {calculationResult.discountBreakdown.map((breakdown, index) => (
            <p key={index}>{breakdown}</p>
          ))}
        </>
      )}
    </div>
  );
}
```

### Vue Example

```typescript
import { computed, ref } from 'vue';
import { discountCalculationService, Discount, OrderItem } from './discount-calculation-frontend.service';

export default {
  setup() {
    const discounts = ref<Discount[]>([]);
    const orderItems = ref<OrderItem[]>([]);
    const voucherCode = ref<string>('');

    const calculationResult = computed(() => {
      if (discounts.value.length === 0 || orderItems.value.length === 0) {
        return null;
      }

      return discountCalculationService.calculateDiscounts(
        discounts.value,
        orderItems.value,
        { voucherCode: voucherCode.value || null }
      );
    });

    return {
      discounts,
      orderItems,
      voucherCode,
      calculationResult,
    };
  },
};
```

## Error Handling

The service handles errors gracefully:
- Invalid discounts are skipped with error logging
- Calculation continues with remaining discounts
- Negative totals are prevented (minimum 0)
- All edge cases are handled (null values, missing data, etc.)

## Testing

Test your discount calculations with various scenarios:

```typescript
// Test with empty discounts
const result1 = discountService.calculateDiscounts([], orderItems);

// Test with expired discount
const expiredDiscount: Discount = {
  ...discount,
  endDate: '2023-01-01', // Past date
};

// Test with minimum order not met
const minOrderDiscount: Discount = {
  ...discount,
  minOrderValue: 1000,
};

// Test with usage limit reached
const limitedDiscount: Discount = {
  ...discount,
  maxUsageCount: 10,
  usageCount: 10, // Limit reached
};
```

