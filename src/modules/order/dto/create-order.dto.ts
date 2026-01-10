import {
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';
import { CustomerDetailsDto } from '../../customer/dto/customer-details.dto';
import { PaymentMethod, OrderSource } from '../entities/order.enums';

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => CustomerDetailsDto)
  customer: CustomerDetailsDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  orderItems: CreateOrderItemDto[];

  @IsEnum(OrderSource)
  @IsOptional()
  orderSource?: OrderSource;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsNumber()
  @IsOptional()
  @Min(0)
  orderDiscount?: number;

  @IsString()
  @IsOptional()
  voucherCode?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  shippingCost?: number;

  @IsString()
  @IsOptional()
  internalNotes?: string;

  @IsString()
  @IsOptional()
  referrerSource?: string;
}

