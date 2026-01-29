import { ExpenseByTypeSubtypeItemDto } from './expense-monthly-report-response.dto';

/**
 * Daily expense stats: total amount, count, and breakdown by type and subtype.
 */
export class ExpenseDailyStatsResponseDto {
  /** Date (YYYY-MM-DD). */
  date: string;
  /** Total expense amount for the day. */
  totalAmount: number;
  /** Number of expenses on the day. */
  count: number;
  /** Breakdown by (type, subtype). Same item shape as monthly report. */
  byTypeAndSubtype: ExpenseByTypeSubtypeItemDto[];
}
