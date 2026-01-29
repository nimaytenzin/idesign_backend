import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/dto/pagination-query.dto';
import { FulfillmentStatus, PaymentStatus, OrderSource, FulfillmentType } from '../entities/order.enums';

/**
 * DTO for querying orders with pagination and filters.
 * Supports phase-based views: Delivered & Paid (fulfillmentStatus=DELIVERED, paymentStatus=PAID),
 * Collection Gap (fulfillmentStatus=DELIVERED, paymentStatus=PENDING or PARTIAL), etc.
 * Admin and Staff only endpoint.
 */
export class GetOrdersPaginatedQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(FulfillmentStatus)
  fulfillmentStatus?: FulfillmentStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsEnum(OrderSource)
  orderSource?: OrderSource;

  @IsOptional()
  @IsEnum(FulfillmentType)
  fulfillmentType?: FulfillmentType;

  /** Inclusive: orders with placedAt >= start of this date (ISO 8601, e.g. YYYY-MM-DD). */
  @IsOptional()
  @IsDateString()
  placedAtFrom?: string;

  /** Inclusive: orders with placedAt <= end of this date (ISO 8601, e.g. YYYY-MM-DD). */
  @IsOptional()
  @IsDateString()
  placedAtTo?: string;
}
