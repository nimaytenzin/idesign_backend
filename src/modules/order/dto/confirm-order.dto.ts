import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaymentMethod } from '../entities/order.enums';

/**
 * DTO for confirming an order
 * Updates payment status to PAID and fulfillment status from PLACED to CONFIRMED
 */
export class ConfirmOrderDto {
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  internalNotes?: string;
}
