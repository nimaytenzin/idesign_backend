import {
  IsNumber,
  IsNotEmpty,
  Min,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(0)
  discountApplied?: number;
}

