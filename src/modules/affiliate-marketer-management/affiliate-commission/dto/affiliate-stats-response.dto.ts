export class ProductSoldDto {
  productId: number;
  productName?: string;
  quantity: number;
  totalAmount: number;
}

export class AffiliateStatsResponseDto {
  totalOrders: number;
  totalAmountSold: number;
  totalCommission: number;
  productsSold: ProductSoldDto[];
}
