import { IsOptional, IsDateString } from 'class-validator';

/**
 * Query DTO for listing expenses with optional date range filters.
 * Used by GET /expenses?startDate=...&endDate=...
 */
export class ExpenseQueryDto {
  /** Inclusive: expenses with date >= this (ISO 8601, e.g. YYYY-MM-DD). */
  @IsOptional()
  @IsDateString()
  startDate?: string;

  /** Inclusive: expenses with date <= this (ISO 8601, e.g. YYYY-MM-DD). */
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
