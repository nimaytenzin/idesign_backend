/**
 * Frontend Discount Calculation Service
 * 
 * This service handles discount calculation for orders in the frontend.
 * It supports all discount types, value types, scopes, and constraints.
 * 
 * Usage:
 *   import { DiscountCalculationService } from './discount-calculation-frontend.service';
 *   const service = new DiscountCalculationService();
 *   const result = service.calculateDiscounts(discounts, orderItems, options);
 */

// Discount Types
export enum DiscountType {
  FLAT_ALL_PRODUCTS = 'FLAT_ALL_PRODUCTS',
  FLAT_SELECTED_PRODUCTS = 'FLAT_SELECTED_PRODUCTS',
  FLAT_SELECTED_CATEGORIES = 'FLAT_SELECTED_CATEGORIES',
}

// Discount Value Types
export enum DiscountValueType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

// Discount Scope
export enum DiscountScope {
  PER_PRODUCT = 'PER_PRODUCT',
  ORDER_TOTAL = 'ORDER_TOTAL',
}

// Discount Interface (as received from API)
export interface Discount {
  id: number;
  name: string;
  description?: string | null;
  discountType: DiscountType;
  valueType: DiscountValueType;
  discountValue: number;
  discountScope: DiscountScope;
  startDate: string | Date;
  endDate: string | Date;
  isActive: boolean;
  maxUsageCount: number | null;
  minOrderValue: number | null;
  voucherCode: string | null;
  usageCount: number;
  productIds?: number[];
  categoryIds?: number[];
  subCategoryIds?: number[];
}

// Order Item Interface
export interface OrderItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  // Product metadata for category matching
  productSubCategoryId?: number;
  productCategoryId?: number; // Category ID from subcategory
}

// Product Interface for getDiscount method
export interface Product {
  id: number;
  price: number;
  productSubCategoryId?: number;
  productCategoryId?: number; // Category ID from subcategory
}

// Calculation Options
export interface DiscountCalculationOptions {
  voucherCode?: string | null;
  currentDate?: Date;
  orderSubtotal?: number; // Optional: pre-calculated subtotal
}

// Line Item Discount Result
export interface LineItemDiscount {
  productId: number;
  discountAmount: number;
  appliedDiscountId?: number;
  discountName?: string;
  originalPrice: number;
  discountedPrice: number;
}

// Discount Calculation Result
export interface DiscountCalculationResult {
  orderDiscount: number; // Total discount applied to order total
  lineItemDiscounts: LineItemDiscount[]; // Discounts per product
  appliedDiscounts: Discount[]; // All discounts that were applied
  discountBreakdown: string[]; // Human-readable breakdown
  subtotalBeforeDiscount: number;
  subtotalAfterDiscount: number;
  finalTotal: number;
  applicableDiscounts: Discount[]; // Discounts that passed all checks
  inapplicableDiscounts: Discount[]; // Discounts that didn't pass checks (for debugging)
}

// Product Discount Result
export interface ProductDiscountResult {
  newPrice: number; // New price after discounts
  discountsApplied: Discount[]; // Discounts that were successfully applied
  constraints: string[]; // Reasons why discounts couldn't be applied
}

export class DiscountCalculationService {
  /**
   * Main method to calculate discounts for an order
   * 
   * @param discounts Array of discount objects from the API
   * @param orderItems Array of order items with product information
   * @param options Optional calculation options
   * @returns Discount calculation result with new prices
   */
  calculateDiscounts(
    discounts: Discount[],
    orderItems: OrderItem[],
    options: DiscountCalculationOptions = {},
  ): DiscountCalculationResult {
    const {
      voucherCode = null,
      currentDate = new Date(),
      orderSubtotal: providedSubtotal,
    } = options;

    // Calculate subtotal before discounts
    const subtotalBeforeDiscount =
      providedSubtotal ??
      orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    // Initialize result
    const lineItemDiscounts: LineItemDiscount[] = [];
    const appliedDiscounts: Discount[] = [];
    const applicableDiscounts: Discount[] = [];
    const inapplicableDiscounts: Discount[] = [];
    let orderDiscount = 0;
    const discountBreakdown: string[] = [];

    // Filter applicable discounts
    const filteredDiscounts = this.filterApplicableDiscounts(
      discounts,
      subtotalBeforeDiscount,
      voucherCode,
      currentDate,
      applicableDiscounts,
      inapplicableDiscounts,
    );

    // Track which products have already received discounts (to avoid double discounting)
    const discountedProducts = new Set<number>();
    const lineItemDiscountMap = new Map<
      number,
      { amount: number; discountId?: number; discountName?: string }
    >(); // productId -> discount info

    // Apply discounts
    for (const discount of filteredDiscounts) {
      try {
        switch (discount.discountType) {
          case DiscountType.FLAT_ALL_PRODUCTS:
            this.applyFlatDiscountAllProducts(
              discount,
              orderItems,
              lineItemDiscountMap,
              discountedProducts,
              orderDiscount,
              discountBreakdown,
              subtotalBeforeDiscount,
            );
            if (discount.discountScope === DiscountScope.ORDER_TOTAL) {
              const discountAmount = this.calculateDiscountAmount(
                discount,
                subtotalBeforeDiscount,
              );
              orderDiscount += discountAmount;
              discountBreakdown.push(
                `${discount.name}: ${this.formatDiscountAmount(discount, discountAmount)}`,
              );
            }
            appliedDiscounts.push(discount);
            break;

          case DiscountType.FLAT_SELECTED_PRODUCTS:
            const matchedProducts = this.matchSelectedProducts(
              discount,
              orderItems,
            );
            if (matchedProducts.length > 0) {
              this.applyFlatDiscountSelectedProducts(
                discount,
                orderItems,
                matchedProducts,
                lineItemDiscountMap,
                discountedProducts,
                discountBreakdown,
              );
              appliedDiscounts.push(discount);
            }
            break;

          case DiscountType.FLAT_SELECTED_CATEGORIES:
            const matchedCategoryProducts = this.matchCategoryProducts(
              discount,
              orderItems,
            );
            if (matchedCategoryProducts.length > 0) {
              this.applyFlatDiscountSelectedProducts(
                discount,
                orderItems,
                matchedCategoryProducts,
                lineItemDiscountMap,
                discountedProducts,
                discountBreakdown,
              );
              appliedDiscounts.push(discount);
            }
            break;
        }
      } catch (error) {
        console.error(
          `Error applying discount ${discount.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
        // Continue with other discounts
      }
    }

    // Build line item discounts array with original and discounted prices
    orderItems.forEach((item) => {
      const originalPrice = item.unitPrice * item.quantity;
      const discountInfo = lineItemDiscountMap.get(item.productId);
      const discountAmount = discountInfo?.amount || 0;
      const discountedPrice = Math.max(0, originalPrice - discountAmount);

      lineItemDiscounts.push({
        productId: item.productId,
        discountAmount,
        appliedDiscountId: discountInfo?.discountId,
        discountName: discountInfo?.discountName,
        originalPrice,
        discountedPrice,
      });
    });

    // Calculate final totals
    const lineItemDiscountTotal = Array.from(lineItemDiscountMap.values()).reduce(
      (sum, info) => sum + info.amount,
      0,
    );

    const subtotalAfterDiscount =
      subtotalBeforeDiscount - lineItemDiscountTotal - orderDiscount;
    const finalTotal = Math.max(0, subtotalAfterDiscount); // Ensure non-negative

    return {
      orderDiscount,
      lineItemDiscounts,
      appliedDiscounts,
      discountBreakdown,
      subtotalBeforeDiscount,
      subtotalAfterDiscount,
      finalTotal,
      applicableDiscounts,
      inapplicableDiscounts,
    };
  }

  /**
   * Filter discounts based on all constraints
   */
  private filterApplicableDiscounts(
    discounts: Discount[],
    subtotalBeforeDiscount: number,
    voucherCode: string | null,
    currentDate: Date,
    applicableDiscounts: Discount[],
    inapplicableDiscounts: Discount[],
  ): Discount[] {
    return discounts.filter((discount) => {
      // Check if discount is active
      if (!discount.isActive) {
        inapplicableDiscounts.push({ ...discount });
        return false;
      }

      // Check date range
      const startDate = new Date(discount.startDate);
      const endDate = new Date(discount.endDate);
      if (currentDate < startDate || currentDate > endDate) {
        inapplicableDiscounts.push({ ...discount });
        return false;
      }

      // Check voucher code
      if (voucherCode) {
        // If voucher code provided, only apply discounts with matching code
        if (discount.voucherCode !== voucherCode) {
          inapplicableDiscounts.push({ ...discount });
          return false;
        }
      } else {
        // If no voucher code, only apply discounts without voucher code (auto-apply)
        if (discount.voucherCode) {
          inapplicableDiscounts.push({ ...discount });
          return false;
        }
      }

      // Check minimum order value
      if (discount.minOrderValue !== null) {
        if (subtotalBeforeDiscount < discount.minOrderValue) {
          inapplicableDiscounts.push({ ...discount });
          return false;
        }
      }

      // Check usage limits
      if (discount.maxUsageCount !== null) {
        if (discount.usageCount >= discount.maxUsageCount) {
          inapplicableDiscounts.push({ ...discount });
          return false;
        }
      }

      // Discount passed all checks
      applicableDiscounts.push({ ...discount });
      return true;
    });
  }

  /**
   * Apply flat discount to all products
   */
  private applyFlatDiscountAllProducts(
    discount: Discount,
    orderItems: OrderItem[],
    lineItemDiscountMap: Map<
      number,
      { amount: number; discountId?: number; discountName?: string }
    >,
    discountedProducts: Set<number>,
    orderDiscount: number,
    discountBreakdown: string[],
    subtotalBeforeDiscount: number,
  ): void {
    // If ORDER_TOTAL scope, handle separately (don't apply to line items)
    if (discount.discountScope === DiscountScope.ORDER_TOTAL) {
      return;
    }

    // Apply to each product
    for (const item of orderItems) {
      if (discountedProducts.has(item.productId)) {
        continue; // Skip if already discounted
      }

      const lineSubtotal = item.unitPrice * item.quantity;
      const discountAmount = this.calculateDiscountAmount(discount, lineSubtotal);

      const currentInfo = lineItemDiscountMap.get(item.productId);
      const currentAmount = currentInfo?.amount || 0;
      lineItemDiscountMap.set(item.productId, {
        amount: currentAmount + discountAmount,
        discountId: discount.id,
        discountName: discount.name,
      });

      discountedProducts.add(item.productId);

      discountBreakdown.push(
        `${discount.name} on Product ${item.productId}: ${this.formatDiscountAmount(discount, discountAmount)}`,
      );
    }
  }

  /**
   * Apply flat discount to selected products
   */
  private applyFlatDiscountSelectedProducts(
    discount: Discount,
    orderItems: OrderItem[],
    matchedProductIds: number[],
    lineItemDiscountMap: Map<
      number,
      { amount: number; discountId?: number; discountName?: string }
    >,
    discountedProducts: Set<number>,
    discountBreakdown: string[],
  ): void {
    for (const item of orderItems) {
      if (!matchedProductIds.includes(item.productId)) {
        continue;
      }

      if (discountedProducts.has(item.productId)) {
        continue; // Skip if already discounted
      }

      const lineSubtotal = item.unitPrice * item.quantity;
      const discountAmount = this.calculateDiscountAmount(discount, lineSubtotal);

      const currentInfo = lineItemDiscountMap.get(item.productId);
      const currentAmount = currentInfo?.amount || 0;
      lineItemDiscountMap.set(item.productId, {
        amount: currentAmount + discountAmount,
        discountId: discount.id,
        discountName: discount.name,
      });

      discountedProducts.add(item.productId);

      discountBreakdown.push(
        `${discount.name} on Product ${item.productId}: ${this.formatDiscountAmount(discount, discountAmount)}`,
      );
    }
  }

  /**
   * Match products for FLAT_SELECTED_PRODUCTS discount type
   */
  private matchSelectedProducts(
    discount: Discount,
    orderItems: OrderItem[],
  ): number[] {
    if (!discount.productIds || discount.productIds.length === 0) {
      return [];
    }

    const discountProductIds = discount.productIds;
    const orderProductIds = orderItems.map((item) => item.productId);
    return orderProductIds.filter((id) => discountProductIds.includes(id));
  }

  /**
   * Match products for FLAT_SELECTED_CATEGORIES discount type
   */
  private matchCategoryProducts(
    discount: Discount,
    orderItems: OrderItem[],
  ): number[] {
    const categoryIds = discount.categoryIds || [];
    const subCategoryIds = discount.subCategoryIds || [];

    if (categoryIds.length === 0 && subCategoryIds.length === 0) {
      return [];
    }

    const matchedProductIds: number[] = [];

    for (const item of orderItems) {
      // Check if product's subcategory matches directly
      if (
        item.productSubCategoryId &&
        subCategoryIds.includes(item.productSubCategoryId)
      ) {
        matchedProductIds.push(item.productId);
        continue;
      }

      // Check if product's category matches
      if (
        item.productCategoryId &&
        categoryIds.includes(item.productCategoryId)
      ) {
        matchedProductIds.push(item.productId);
      }
    }

    return matchedProductIds;
  }

  /**
   * Calculate discount amount based on value type
   */
  private calculateDiscountAmount(discount: Discount, amount: number): number {
    if (discount.valueType === DiscountValueType.PERCENTAGE) {
      const percentage = Number(discount.discountValue);
      return (amount * percentage) / 100;
    } else {
      // FIXED_AMOUNT
      return Number(discount.discountValue);
    }
  }

  /**
   * Format discount amount for display
   */
  private formatDiscountAmount(discount: Discount, amount: number): string {
    if (discount.valueType === DiscountValueType.PERCENTAGE) {
      return `${discount.discountValue}% (Nu. ${amount.toFixed(2)})`;
    } else {
      return `Nu. ${amount.toFixed(2)}`;
    }
  }

  /**
   * Helper method to get the new price for a single product after discounts
   * 
   * @param productId Product ID
   * @param originalPrice Original price (unit price * quantity)
   * @param discounts Array of applicable discounts
   * @param orderItems All order items (for context)
   * @param options Calculation options
   * @returns New price after discounts
   */
  getProductPriceAfterDiscount(
    productId: number,
    originalPrice: number,
    discounts: Discount[],
    orderItems: OrderItem[],
    options: DiscountCalculationOptions = {},
  ): number {
    const item = orderItems.find((i) => i.productId === productId);
    if (!item) {
      return originalPrice;
    }

    const result = this.calculateDiscounts(discounts, orderItems, options);
    const lineItemDiscount = result.lineItemDiscounts.find(
      (lid) => lid.productId === productId,
    );

    return lineItemDiscount?.discountedPrice ?? originalPrice;
  }

  /**
   * Helper method to check if a discount can be applied to an order
   * 
   * @param discount Discount to check
   * @param orderSubtotal Order subtotal
   * @param voucherCode Optional voucher code
   * @param currentDate Current date (defaults to now)
   * @returns Object with canApply flag and reason if not applicable
   */
  canApplyDiscount(
    discount: Discount,
    orderSubtotal: number,
    voucherCode?: string | null,
    currentDate: Date = new Date(),
  ): { canApply: boolean; reason?: string } {
    if (!discount.isActive) {
      return { canApply: false, reason: 'Discount is not active' };
    }

    const startDate = new Date(discount.startDate);
    const endDate = new Date(discount.endDate);
    if (currentDate < startDate) {
      return { canApply: false, reason: 'Discount has not started yet' };
    }
    if (currentDate > endDate) {
      return { canApply: false, reason: 'Discount has expired' };
    }

    if (voucherCode) {
      if (discount.voucherCode !== voucherCode) {
        return { canApply: false, reason: 'Voucher code does not match' };
      }
    } else {
      if (discount.voucherCode) {
        return {
          canApply: false,
          reason: 'Voucher code required for this discount',
        };
      }
    }

    if (discount.minOrderValue !== null) {
      if (orderSubtotal < discount.minOrderValue) {
        return {
          canApply: false,
          reason: `Minimum order value of Nu. ${discount.minOrderValue} required`,
        };
      }
    }

    if (discount.maxUsageCount !== null) {
      if (discount.usageCount >= discount.maxUsageCount) {
        return { canApply: false, reason: 'Discount usage limit reached' };
      }
    }

    return { canApply: true };
  }

  /**
   * Get discount for a single product
   * 
   * @param product Product object with id, price, and category information
   * @param discounts Array of discount objects from the API
   * @param options Optional calculation options (voucherCode, currentDate)
   * @returns Product discount result with new price, applied discounts, and constraints
   */
  getDiscount(
    product: Product,
    discounts: Discount[],
    options: DiscountCalculationOptions = {},
  ): ProductDiscountResult {
    const {
      voucherCode = null,
      currentDate = new Date(),
    } = options;

    const originalPrice = product.price;
    let newPrice = originalPrice;
    const discountsApplied: Discount[] = [];
    const constraints: string[] = [];

    // Filter applicable discounts for this product
    const applicableDiscounts = discounts.filter((discount) => {
      // Check if discount is active
      if (!discount.isActive) {
        constraints.push(`${discount.name}: Discount is not active`);
        return false;
      }

      // Check date range
      const startDate = new Date(discount.startDate);
      const endDate = new Date(discount.endDate);
      if (currentDate < startDate) {
        constraints.push(`${discount.name}: Discount has not started yet`);
        return false;
      }
      if (currentDate > endDate) {
        constraints.push(`${discount.name}: Discount has expired`);
        return false;
      }

      // Check voucher code
      if (voucherCode) {
        if (discount.voucherCode !== voucherCode) {
          constraints.push(`${discount.name}: Voucher code does not match`);
          return false;
        }
      } else {
        if (discount.voucherCode) {
          constraints.push(`${discount.name}: Voucher code required`);
          return false;
        }
      }

      // Check usage limits
      if (discount.maxUsageCount !== null) {
        if (discount.usageCount >= discount.maxUsageCount) {
          constraints.push(`${discount.name}: Usage limit reached`);
          return false;
        }
      }

      // Check if discount applies to this product based on discount type
      switch (discount.discountType) {
        case DiscountType.FLAT_ALL_PRODUCTS:
          return true; // Applies to all products

        case DiscountType.FLAT_SELECTED_PRODUCTS:
          if (!discount.productIds || discount.productIds.length === 0) {
            constraints.push(`${discount.name}: No products selected for this discount`);
            return false;
          }
          if (!discount.productIds.includes(product.id)) {
            constraints.push(`${discount.name}: Product not included in discount`);
            return false;
          }
          return true;

        case DiscountType.FLAT_SELECTED_CATEGORIES:
          const categoryIds = discount.categoryIds || [];
          const subCategoryIds = discount.subCategoryIds || [];
          
          if (categoryIds.length === 0 && subCategoryIds.length === 0) {
            constraints.push(`${discount.name}: No categories selected for this discount`);
            return false;
          }

          // Check if product's subcategory matches
          if (product.productSubCategoryId && subCategoryIds.includes(product.productSubCategoryId)) {
            return true;
          }

          // Check if product's category matches
          if (product.productCategoryId && categoryIds.includes(product.productCategoryId)) {
            return true;
          }

          constraints.push(`${discount.name}: Product category not included in discount`);
          return false;

        default:
          constraints.push(`${discount.name}: Unknown discount type`);
          return false;
      }
    });

    // Apply discounts (only PER_PRODUCT scope for single product)
    // Note: ORDER_TOTAL scope discounts require order context, so we skip them here
    let totalDiscountAmount = 0;

    for (const discount of applicableDiscounts) {
      // Skip ORDER_TOTAL scope discounts for single product calculation
      if (discount.discountScope === DiscountScope.ORDER_TOTAL) {
        constraints.push(`${discount.name}: Requires order total calculation`);
        continue;
      }

      // Calculate discount amount
      const discountAmount = this.calculateDiscountAmount(discount, originalPrice);
      totalDiscountAmount += discountAmount;
      discountsApplied.push(discount);
    }

    // Calculate new price (ensure it doesn't go below 0)
    newPrice = Math.max(0, originalPrice - totalDiscountAmount);

    return {
      newPrice,
      discountsApplied,
      constraints,
    };
  }
}

// Export singleton instance for convenience
export const discountCalculationService = new DiscountCalculationService();

