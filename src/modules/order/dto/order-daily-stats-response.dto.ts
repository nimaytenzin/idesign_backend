/**
 * Daily order stats: total orders (status != PLACED), revenue, total to collect for one day.
 */
export class OrderDailyStatsResponseDto {
  /** Date (YYYY-MM-DD). */
  date: string;
  /** Number of orders on the day with fulfillmentStatus !== PLACED. */
  totalOrders: number;
  /** Sum of totalPayable for orders with paymentStatus === PAID. */
  revenue: number;
  /** Sum of (totalPayable - totalPaid) for orders with paymentStatus PENDING or PARTIAL. */
  totalToCollect: number;
}
