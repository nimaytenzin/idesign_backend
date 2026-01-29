import {
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';
import { CustomerDetailsDto } from '../../customer/dto/customer-details.dto';
import { PaymentMethod, OrderSource, FulfillmentType } from '../entities/order.enums';

export class CreateOrderDto {
  // Customer Information
  @ValidateNested()
  @Type(() => CustomerDetailsDto)
  @IsNotEmpty()
  customer: CustomerDetailsDto;

  // Order Items
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsNotEmpty()
  orderItems: CreateOrderItemDto[];

  // Order Classification
  @IsEnum(OrderSource)
  @IsOptional()
  orderSource?: OrderSource;

  @IsEnum(FulfillmentType)
  @IsOptional()
  fulfillmentType?: FulfillmentType;

  // Payment Information
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  /** Optional. When paymentMethod is not CASH and not provided, the bank account with useForRmaPg is used (e.g. online, RMA PG). */
  @IsOptional()
  @IsNumber()
  bankAccountId?: number;

  // Financial Information
  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number;

  @IsString()
  @IsOptional()
  voucherCode?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  deliveryCost?: number;

  // Delivery Information
  @ValidateIf((o) => o.fulfillmentType === FulfillmentType.DELIVERY)
  @IsNumber()
  @IsNotEmpty({ message: 'deliveryRateId is required when fulfillmentType is DELIVERY' })
  deliveryRateId?: number;

  @ValidateIf((o) => o.fulfillmentType === FulfillmentType.DELIVERY)
  @IsString()
  @IsNotEmpty({ message: 'shippingAddress is required when fulfillmentType is DELIVERY' })
  shippingAddress?: string;

  @IsString()
  @IsOptional()
  deliveryNotes?: string;

  // Additional Information
  @IsString()
  @IsOptional()
  internalNotes?: string;

  @IsString()
  @IsOptional()
  referrerSource?: string;

  @IsString()
  @IsOptional()
  transactionId?: string;

  // User References
  @IsNumber()
  @IsOptional()
  servedBy?: number;
}

