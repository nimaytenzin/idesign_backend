import { IsDateString } from 'class-validator';

/**
 * Query DTO for daily expense stats.
 * Used by GET /expenses/daily-stats?date=YYYY-MM-DD
 */
export class ExpenseDailyStatsQueryDto {
  /** Date (ISO 8601 date, e.g. YYYY-MM-DD). */
  @IsDateString()
  date: string;
}
