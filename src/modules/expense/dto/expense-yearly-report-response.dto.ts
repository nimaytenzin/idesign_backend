import { ExpenseMonthlyReportResponseDto } from './expense-monthly-report-response.dto';

/**
 * Yearly report: all 12 monthly reports for the given year (expenses by type and subtype).
 */
export class ExpenseYearlyReportResponseDto {
  /** Year (e.g. 2025). */
  year: number;
  /** One entry per month (1–12); same shape as GET /expenses/monthly-report. */
  monthlyReports: ExpenseMonthlyReportResponseDto[];
}
