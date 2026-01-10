import { IsOptional, IsEnum } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/dto/pagination-query.dto';
import { FulfillmentStatus } from '../entities/order.enums';

/**
 * DTO for querying orders with pagination and fulfillment status filter
 * Admin and Staff only endpoint
 */
export class GetOrdersPaginatedQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(FulfillmentStatus)
  fulfillmentStatus?: FulfillmentStatus;
}
