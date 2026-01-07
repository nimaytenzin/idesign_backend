import { IsArray, IsNumber, IsOptional, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemForDiscountDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  @IsOptional()
  quantity: number;

  @IsNumber()
  @IsOptional()
  unitPrice: number;
}

export class CalculateDiscountDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemForDiscountDto)
  orderItems: OrderItemForDiscountDto[];

  @IsNumber()
  @IsOptional()
  orderSubtotal?: number; // Optional: if provided, use this instead of calculating

  @IsString()
  @IsOptional()
  voucherCode?: string; // Optional voucher code to apply
}

