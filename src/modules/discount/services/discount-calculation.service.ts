import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Discount, DiscountType, DiscountValueType, DiscountScope } from '../entities/discount.entity';
import { DiscountProduct } from '../entities/discount-product.entity';
import { DiscountCategory } from '../entities/discount-category.entity';
import { DiscountSubcategory } from '../entities/discount-subcategory.entity';
import { Product } from '../../product/entities/product.entity';
import { ProductSubCategory } from '../../product-sub-category/entities/product-sub-category.entity';
import { DiscountService } from './discount.service';
import { CalculateDiscountDto } from '../dto/calculate-discount.dto';
import { Op } from 'sequelize';

export interface LineItemDiscount {
  productId: number;
  discountAmount: number;
  appliedDiscountId?: number;
  discountType?: string;
}

export interface DiscountCalculationResult {
  orderDiscount: number;
  lineItemDiscounts: LineItemDiscount[];
  appliedDiscounts: Discount[];
  discountBreakdown: string;
  subtotalBeforeDiscount: number;
  subtotalAfterDiscount: number;
  finalTotal: number;
}

@Injectable()
export class DiscountCalculationService {
  private readonly logger = new Logger(DiscountCalculationService.name);

  constructor(
    @InjectModel(Discount)
    private discountModel: typeof Discount,
    @InjectModel(DiscountProduct)
    private discountProductModel: typeof DiscountProduct,
    @InjectModel(DiscountCategory)
    private discountCategoryModel: typeof DiscountCategory,
    @InjectModel(DiscountSubcategory)
    private discountSubcategoryModel: typeof DiscountSubcategory,
    @InjectModel(Product)
    private productModel: typeof Product,
    @InjectModel(ProductSubCategory)
    private productSubCategoryModel: typeof ProductSubCategory,
    private readonly discountService: DiscountService,
  ) {}

  async calculateOrderDiscounts(
    orderItems: Array<{
      productId: number;
      quantity: number;
      unitPrice: number;
    }>,
    voucherCode?: string,
  ): Promise<DiscountCalculationResult> {
    this.logger.log(
      `[Discount Calculation] Starting discount calculation for ${orderItems.length} items`,
    );

    // Calculate subtotal before discounts
    const subtotalBeforeDiscount = orderItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    this.logger.log(
      `[Discount Calculation] Subtotal before discount: ${subtotalBeforeDiscount}`,
    );

    // Initialize result
    const lineItemDiscounts: LineItemDiscount[] = [];
    const appliedDiscounts: Discount[] = [];
    let orderDiscount = 0;
    const discountBreakdown: string[] = [];

    // Load products with their categories for matching
    const productIds = orderItems.map((item) => item.productId);
    const products = await this.productModel.findAll({
      where: { id: { [Op.in]: productIds } },
    });

    // Load all active discounts
    const activeDiscounts = await this.discountService.findActive();

    this.logger.log(
      `[Discount Calculation] Found ${activeDiscounts.length} active discount(s)`,
    );

    // Filter discounts by voucher code if provided
    let applicableDiscounts = activeDiscounts.filter((discount) => {
      if (voucherCode) {
        // If voucher code provided, only apply discounts with matching code
        return discount.voucherCode === voucherCode;
      } else {
        // If no voucher code, only apply discounts without voucher code (auto-apply)
        return !discount.voucherCode;
      }
    });

    // Filter by minimum order value
    applicableDiscounts = applicableDiscounts.filter((discount) => {
      if (discount.minOrderValue) {
        return subtotalBeforeDiscount >= parseFloat(discount.minOrderValue.toString());
      }
      return true;
    });

    // Filter by usage limits
    applicableDiscounts = applicableDiscounts.filter((discount) => {
      if (discount.maxUsageCount) {
        return discount.usageCount < discount.maxUsageCount;
      }
      return true;
    });

    this.logger.log(
      `[Discount Calculation] ${applicableDiscounts.length} discount(s) applicable after filtering`,
    );

    // Track which products have already received discounts (to avoid double discounting)
    const discountedProducts = new Set<number>();
    const lineItemDiscountMap = new Map<number, number>(); // productId -> total discount amount

    // Apply discounts
    for (const discount of applicableDiscounts) {
      this.logger.log(
        `[Discount Calculation] Processing discount: ${discount.name} (Type: ${discount.discountType})`,
      );

      try {
        switch (discount.discountType) {
          case DiscountType.FLAT_ALL_PRODUCTS:
            await this.applyFlatDiscountAllProducts(
              discount,
              orderItems,
              lineItemDiscountMap,
              discountedProducts,
              orderDiscount,
              discountBreakdown,
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
            const matchedProducts = await this.matchSelectedProducts(
              discount,
              productIds,
            );
            if (matchedProducts.length > 0) {
              await this.applyFlatDiscountSelectedProducts(
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
            const matchedCategoryProducts = await this.matchCategoryProducts(
              discount,
              products,
            );
            if (matchedCategoryProducts.length > 0) {
              await this.applyFlatDiscountSelectedProducts(
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
        this.logger.error(
          `[Discount Calculation] Error applying discount ${discount.id}: ${error.message}`,
        );
        // Continue with other discounts
      }
    }

    // Build line item discounts array
    lineItemDiscountMap.forEach((discountAmount, productId) => {
      lineItemDiscounts.push({
        productId,
        discountAmount,
      });
    });

    // Calculate final totals
    const lineItemDiscountTotal = Array.from(lineItemDiscountMap.values()).reduce(
      (sum, amount) => sum + amount,
      0,
    );

    const subtotalAfterDiscount =
      subtotalBeforeDiscount - lineItemDiscountTotal - orderDiscount;
    const finalTotal = Math.max(0, subtotalAfterDiscount); // Ensure non-negative

    this.logger.log(
      `[Discount Calculation] Calculation complete:`,
    );
    this.logger.log(
      `  - Line item discounts: ${lineItemDiscountTotal}`,
    );
    this.logger.log(
      `  - Order discount: ${orderDiscount}`,
    );
    this.logger.log(
      `  - Final total: ${finalTotal}`,
    );

    return {
      orderDiscount,
      lineItemDiscounts,
      appliedDiscounts,
      discountBreakdown: discountBreakdown.join('; '),
      subtotalBeforeDiscount,
      subtotalAfterDiscount,
      finalTotal,
    };
  }

  private async applyFlatDiscountAllProducts(
    discount: Discount,
    orderItems: Array<{ productId: number; quantity: number; unitPrice: number }>,
    lineItemDiscountMap: Map<number, number>,
    discountedProducts: Set<number>,
    orderDiscount: number,
    discountBreakdown: string[],
  ): Promise<void> {
    if (discount.discountScope === DiscountScope.ORDER_TOTAL) {
      // Handled separately in main calculation
      return;
    }

    // Apply to each product
    for (const item of orderItems) {
      if (discountedProducts.has(item.productId)) {
        continue; // Skip if already discounted
      }

      const lineSubtotal = item.unitPrice * item.quantity;
      const discountAmount = this.calculateDiscountAmount(discount, lineSubtotal);

      const currentDiscount = lineItemDiscountMap.get(item.productId) || 0;
      lineItemDiscountMap.set(
        item.productId,
        currentDiscount + discountAmount,
      );

      discountedProducts.add(item.productId);

      discountBreakdown.push(
        `${discount.name} on Product ${item.productId}: ${this.formatDiscountAmount(discount, discountAmount)}`,
      );
    }
  }

  private async applyFlatDiscountSelectedProducts(
    discount: Discount,
    orderItems: Array<{ productId: number; quantity: number; unitPrice: number }>,
    matchedProductIds: number[],
    lineItemDiscountMap: Map<number, number>,
    discountedProducts: Set<number>,
    discountBreakdown: string[],
  ): Promise<void> {
    for (const item of orderItems) {
      if (!matchedProductIds.includes(item.productId)) {
        continue;
      }

      if (discountedProducts.has(item.productId)) {
        continue; // Skip if already discounted
      }

      const lineSubtotal = item.unitPrice * item.quantity;
      const discountAmount = this.calculateDiscountAmount(discount, lineSubtotal);

      const currentDiscount = lineItemDiscountMap.get(item.productId) || 0;
      lineItemDiscountMap.set(
        item.productId,
        currentDiscount + discountAmount,
      );

      discountedProducts.add(item.productId);

      discountBreakdown.push(
        `${discount.name} on Product ${item.productId}: ${this.formatDiscountAmount(discount, discountAmount)}`,
      );
    }
  }

  private async matchSelectedProducts(
    discount: Discount,
    productIds: number[],
  ): Promise<number[]> {
    const discountProducts = await this.discountProductModel.findAll({
      where: { discountId: discount.id },
    });

    const discountProductIds = discountProducts.map((dp) => dp.productId);
    return productIds.filter((id) => discountProductIds.includes(id));
  }

  private async matchCategoryProducts(
    discount: Discount,
    products: Product[],
  ): Promise<number[]> {
    const discountCategories = await this.discountCategoryModel.findAll({
      where: { discountId: discount.id },
    });

    const discountSubcategories = await this.discountSubcategoryModel.findAll({
      where: { discountId: discount.id },
    });

    const categoryIds = discountCategories.map((dc) => dc.categoryId);
    const subCategoryIds = discountSubcategories.map((ds) => ds.subCategoryId);

    // Load subcategories with their categories for matching
    const productSubCategoryIds = products
      .map((p) => p.productSubCategoryId)
      .filter((id) => id !== null && id !== undefined) as number[];

    const matchedProductIds: number[] = [];

    if (productSubCategoryIds.length > 0) {
      // Query subcategories
      const subCategories = await this.productSubCategoryModel.findAll({
        where: { id: { [Op.in]: productSubCategoryIds } },
      });

      const subCategoryMap = new Map(
        subCategories.map((sc) => [sc.id, sc]),
      );

      for (const product of products) {
        // Check if product's subcategory matches directly
        if (
          product.productSubCategoryId &&
          subCategoryIds.includes(product.productSubCategoryId)
        ) {
          matchedProductIds.push(product.id);
          continue;
        }

        // Check if product's subcategory's category matches
        if (product.productSubCategoryId) {
          const subCategory = subCategoryMap.get(product.productSubCategoryId);
          const subCat = subCategory as any;
          if (subCat && categoryIds.includes(subCat.productCategoryId)) {
            matchedProductIds.push(product.id);
          }
        }
      }
    }

    return matchedProductIds;
  }

  private calculateDiscountAmount(
    discount: Discount,
    amount: number,
  ): number {
    if (discount.valueType === DiscountValueType.PERCENTAGE) {
      const percentage = parseFloat(discount.discountValue.toString());
      return (amount * percentage) / 100;
    } else {
      // FIXED_AMOUNT
      return parseFloat(discount.discountValue.toString());
    }
  }

  private formatDiscountAmount(discount: Discount, amount: number): string {
    if (discount.valueType === DiscountValueType.PERCENTAGE) {
      return `${discount.discountValue}% (Nu. ${amount.toFixed(2)})`;
    } else {
      return `Nu. ${amount.toFixed(2)}`;
    }
  }
}

