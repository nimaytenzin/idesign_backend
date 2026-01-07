import { IsEnum, IsBoolean, IsOptional, IsDateString } from 'class-validator';
import { DiscountType } from '../entities/discount.entity';

export class DiscountQueryDto {
  @IsEnum(DiscountType)
  @IsOptional()
  discountType?: DiscountType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  date?: string; // Filter discounts active on this date (defaults to now)
}

