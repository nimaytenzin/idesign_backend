import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';
import { PaymentMethod } from '../entities/order.enums';

/**
 * DTO for counter order: pay now, collect later (PICKUP).
 * Same as CreateOrderDto but paymentMethod is required; fulfillmentType is forced to PICKUP by the service.
 */
export class CounterPayNowPickupLaterDto extends CreateOrderDto {
  @IsEnum(PaymentMethod)
  @IsNotEmpty({ message: 'paymentMethod is required when paying at the counter' })
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  transactionId?: string;
}
