import { IsDateString } from 'class-validator';

/**
 * Query DTO for daily order stats.
 * Used by GET /orders/daily-stats?date=YYYY-MM-DD
 */
export class OrderDailyStatsQueryDto {
  /** Date (ISO 8601 date, e.g. YYYY-MM-DD). */
  @IsDateString()
  date: string;
}
