/**
 * Monthly report: orders where status != PLACED, with revenue and total to collect.
 */
export class OrderMonthlyReportResponseDto {
  year: number;
  month: number;
  /** Number of orders in the month with fulfillmentStatus !== PLACED. */
  totalOrders: number;
  /** Sum of totalPayable for orders with paymentStatus === PAID. */
  revenue: number;
  /** Sum of (totalPayable - totalPaid) for orders with paymentStatus PENDING or PARTIAL. */
  totalToCollect: number;
}
