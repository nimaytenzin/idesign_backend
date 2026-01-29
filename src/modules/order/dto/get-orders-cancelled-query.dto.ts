import { IsOptional, IsDateString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/dto/pagination-query.dto';

/**
 * Query DTO for GET /orders/admin/cancelled (History tab: Cancelled).
 * Paginated list of CANCELED orders, filtered by updatedAt.
 * If updatedAtFrom/updatedAtTo are omitted, the service defaults to the current month.
 */
export class GetOrdersCancelledQueryDto extends PaginationQueryDto {
  /** Inclusive: orders with updatedAt >= start of this date (ISO 8601, e.g. YYYY-MM-DD). Default: start of current month. */
  @IsOptional()
  @IsDateString()
  updatedAtFrom?: string;

  /** Inclusive: orders with updatedAt <= end of this date (ISO 8601, e.g. YYYY-MM-DD). Default: end of current month. */
  @IsOptional()
  @IsDateString()
  updatedAtTo?: string;
}
