import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FulfillmentStatus, PaymentStatus, PaymentMethod } from '../entities/order.enums';

export class UpdateOrderStatusDto {
  @IsEnum(FulfillmentStatus)
  @IsOptional()
  fulfillmentStatus?: FulfillmentStatus;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsString()
  @IsOptional()
  paidAt?: string;

  @IsString()
  @IsOptional()
  internalNotes?: string;
}

