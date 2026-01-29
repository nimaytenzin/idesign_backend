import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query DTO for listing expenses by month.
 * Used by GET /expenses/by-month?year=...&month=...
 */
export class ExpenseByMonthQueryDto {
  /** Year (e.g. 2025). */
  @IsInt()
  @Min(2000, { message: 'year must be at least 2000' })
  @Max(9999, { message: 'year must be at most 9999' })
  @Type(() => Number)
  year: number;

  /** Month (1–12). */
  @IsInt()
  @Min(1, { message: 'month must be between 1 and 12' })
  @Max(12, { message: 'month must be between 1 and 12' })
  @Type(() => Number)
  month: number;
}
