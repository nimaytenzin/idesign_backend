export class ProductSoldMonthlyDto {
  productId: number;
  productName?: string;
  quantity: number;
  totalAmount: number;
}

export class MonthlyReportResponseDto {
  month: number;
  year: number;
  totalCommission: number;
  totalAmountSold: number;
  totalOrders: number;
  productsSold: ProductSoldMonthlyDto[];
}

