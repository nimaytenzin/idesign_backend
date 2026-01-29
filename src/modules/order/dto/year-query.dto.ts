import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query DTO for yearly reports.
 * Used by GET /orders/yearly-report?year=YYYY
 */
export class YearQueryDto {
  /** Year (e.g. 2025). */
  @IsInt()
  @Min(1900, { message: 'year must be at least 1900' })
  @Max(2100, { message: 'year must be at most 2100' })
  @Type(() => Number)
  year: number;
}
