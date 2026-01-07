import {
  IsEnum,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaymentMethod } from '../entities/order.enums';

export class ProcessPaymentDto {
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @IsString()
  @IsOptional()
  internalNotes?: string;
}

