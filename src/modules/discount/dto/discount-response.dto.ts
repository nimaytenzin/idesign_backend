import {
  DiscountType,
  DiscountValueType,
  DiscountScope,
} from '../entities/discount.entity';

export class DiscountResponseDto {
  id: number;
  name: string;
  description: string | null;
  discountType: DiscountType;
  valueType: DiscountValueType;
  discountValue: number;
  discountScope: DiscountScope;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  maxUsageCount: number | null;
  minOrderValue: number | null;
  voucherCode: string | null;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  productIds?: number[];
  categoryIds?: number[];
  subCategoryIds?: number[];
}

