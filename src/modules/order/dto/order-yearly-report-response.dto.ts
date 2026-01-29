import { OrderMonthlyReportResponseDto } from './order-monthly-report-response.dto';

/**
 * Yearly report: all 12 monthly reports for the given year (orders ≠ PLACED, revenue, total to collect).
 */
export class OrderYearlyReportResponseDto {
  /** Year (e.g. 2025). */
  year: number;
  /** One entry per month (1–12); same shape as GET /orders/monthly-report. */
  monthlyReports: OrderMonthlyReportResponseDto[];
}
