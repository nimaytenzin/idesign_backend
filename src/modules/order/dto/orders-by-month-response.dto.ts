import { Order } from '../entities/order.entity';

export class OrdersByMonthResponseDto {
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  totalOrders: number;
  orders: Order[];
}
