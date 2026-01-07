import {
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsArray,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  DiscountType,
  DiscountValueType,
  DiscountScope,
} from '../entities/discount.entity';

export class CreateDiscountDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsEnum(DiscountValueType)
  valueType: DiscountValueType;

  @IsNumber()
  @Min(0)
  discountValue: number;

  @IsEnum(DiscountScope)
  @IsOptional()
  discountScope?: DiscountScope;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxUsageCount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minOrderValue?: number;

  @IsString()
  @IsOptional()
  voucherCode?: string;

  // For FLAT_SELECTED_PRODUCTS
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => (typeof v === 'string' ? parseInt(v, 10) : v));
    }
    return value;
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @ValidateIf((o) => o.discountType === DiscountType.FLAT_SELECTED_PRODUCTS)
  productIds?: number[];

  // For FLAT_SELECTED_CATEGORIES
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => (typeof v === 'string' ? parseInt(v, 10) : v));
    }
    return value;
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @ValidateIf((o) => o.discountType === DiscountType.FLAT_SELECTED_CATEGORIES)
  categoryIds?: number[];

  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => (typeof v === 'string' ? parseInt(v, 10) : v));
    }
    return value;
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @ValidateIf((o) => o.discountType === DiscountType.FLAT_SELECTED_CATEGORIES)
  subCategoryIds?: number[];
}

