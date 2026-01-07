import { FulfillmentStatus } from '../entities/order.enums';

export class OrderStatisticsByMonthResponseDto {
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  totalOrders: number;
  totalRevenue: number;
  totalShippingCost: number;
  averageOrderValue: number;
  ordersByStatus: {
    [key in FulfillmentStatus]: number;
  };
  ordersByPaymentMethod: {
    [key: string]: number;
  };
  completedOrders: number;
  completedRevenue: number;
  cancelledOrders: number;
  pendingOrders: number;
}
