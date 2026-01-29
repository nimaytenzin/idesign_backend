/**
 * One row in the expense monthly report: aggregated by type and subtype.
 */
export class ExpenseByTypeSubtypeItemDto {
  /** Expense type (e.g. "Operating", "Marketing"). Null if not set. */
  type: string | null;
  /** Expense subtype under type (e.g. "Rent", "Ads"). Null if not set. */
  subtype: string | null;
  /** Number of expenses in this (type, subtype) group. */
  count: number;
  /** Sum of amount for this (type, subtype) group. */
  totalAmount: number;
}

/**
 * Monthly report: expenses aggregated by type and subtype.
 */
export class ExpenseMonthlyReportResponseDto {
  year: number;
  month: number;
  /** Breakdown by (type, subtype). */
  byTypeAndSubtype: ExpenseByTypeSubtypeItemDto[];
}
