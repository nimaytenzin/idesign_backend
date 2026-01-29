import {
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { PaymentMethod } from '../../order/entities/order.enums';

export class RecordOrderPaymentDto {
  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  /** Required when paymentMethod is not CASH (MBOB, BDB_EPAY, TPAY, BNB_MPAY, ZPSS). */
  @ValidateIf((o) => o.paymentMethod !== PaymentMethod.CASH)
  @IsNumber({}, { message: 'bankAccountId is required when payment method is not CASH' })
  bankAccountId?: number;

  @IsDateString()
  @IsOptional()
  paidAt?: string;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
