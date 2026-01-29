import { IsOptional, IsDateString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/dto/pagination-query.dto';

/**
 * Query DTO for GET /orders/admin/completed (History tab: Completed).
 * Paginated list of DELIVERED + PAID orders, filtered by deliveredAt.
 * If deliveredAtFrom/deliveredAtTo are omitted, the service defaults to the current month.
 */
export class GetOrdersCompletedQueryDto extends PaginationQueryDto {
  /** Inclusive: orders with deliveredAt >= start of this date (ISO 8601, e.g. YYYY-MM-DD). Default: start of current month. */
  @IsOptional()
  @IsDateString()
  deliveredAtFrom?: string;

  /** Inclusive: orders with deliveredAt <= end of this date (ISO 8601, e.g. YYYY-MM-DD). Default: end of current month. */
  @IsOptional()
  @IsDateString()
  deliveredAtTo?: string;
}
