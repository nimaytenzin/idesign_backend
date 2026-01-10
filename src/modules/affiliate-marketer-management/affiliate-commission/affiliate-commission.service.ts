import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { AffiliateCommission } from './entities/affiliate-commission.entity';
import { Order } from '../../order/entities/order.entity';
import { OrderItem } from '../../order/entities/order-item.entity';
import { Product } from '../../product/entities/product.entity';
import { AffiliateCommissionResponseDto } from './dto/affiliate-commission-response.dto';
import { AffiliateStatsResponseDto, ProductSoldDto } from './dto/affiliate-stats-response.dto';
import { MonthlyReportResponseDto, ProductSoldMonthlyDto } from './dto/monthly-report-response.dto';
import { MonthlyReportQueryDto } from './dto/monthly-report-query.dto';

@Injectable()
export class AffiliateCommissionService {
  constructor(
    @InjectModel(AffiliateCommission)
    private affiliateCommissionModel: typeof AffiliateCommission,
    @InjectModel(Order)
    private orderModel: typeof Order,
    @InjectModel(OrderItem)
    private orderItemModel: typeof OrderItem,
    @InjectModel(Product)
    private productModel: typeof Product,
  ) {}

  async getTotalCommission(affiliateId: number): Promise<AffiliateCommissionResponseDto> {
    const commissions = await this.affiliateCommissionModel.findAll({
      where: { affiliateId },
      include: [
        {
          model: Order,
          as: 'order',
        },
      ],
    });

    const totalCommission = commissions.reduce(
      (sum, commission) => sum + parseFloat(commission.commissionAmount.toString()),
      0,
    );

    const totalOrders = commissions.length;

    const totalAmountSold = commissions.reduce(
      (sum, commission) => sum + parseFloat(commission.orderTotal.toString()),
      0,
    );

    return {
      totalCommission,
      totalOrders,
      totalAmountSold,
    };
  }

  async getStats(affiliateId: number): Promise<AffiliateStatsResponseDto> {
    const commissions = await this.affiliateCommissionModel.findAll({
      where: { affiliateId },
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: OrderItem,
              as: 'orderItems',
              include: [
                {
                  model: Product,
                  as: 'product',
                },
              ],
            },
          ],
        },
      ],
    });

    const totalOrders = commissions.length;

    const totalAmountSold = commissions.reduce(
      (sum, commission) => sum + parseFloat(commission.orderTotal.toString()),
      0,
    );

    const totalCommission = commissions.reduce(
      (sum, commission) => sum + parseFloat(commission.commissionAmount.toString()),
      0,
    );

    // Aggregate products sold
    const productMap = new Map<number, ProductSoldDto>();

    for (const commission of commissions) {
      if (commission.order && commission.order.orderItems) {
        for (const orderItem of commission.order.orderItems) {
          const productId = orderItem.productId;
          const existing = productMap.get(productId);

          if (existing) {
            existing.quantity += orderItem.quantity;
            existing.totalAmount += parseFloat(orderItem.lineTotal.toString());
          } else {
            productMap.set(productId, {
              productId,
              productName: orderItem.product?.title || undefined,
              quantity: orderItem.quantity,
              totalAmount: parseFloat(orderItem.lineTotal.toString()),
            });
          }
        }
      }
    }

    const productsSold = Array.from(productMap.values());

    return {
      totalOrders,
      totalAmountSold,
      totalCommission,
      productsSold,
    };
  }

  async getMonthlyReport(
    affiliateId: number,
    queryDto: MonthlyReportQueryDto,
  ): Promise<MonthlyReportResponseDto> {
    const now = new Date();
    const month = queryDto.month ?? now.getMonth() + 1;
    const year = queryDto.year ?? now.getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const commissions = await this.affiliateCommissionModel.findAll({
      where: {
        affiliateId,
        orderDate: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: OrderItem,
              as: 'orderItems',
              include: [
                {
                  model: Product,
                  as: 'product',
                },
              ],
            },
          ],
        },
      ],
    });

    const totalCommission = commissions.reduce(
      (sum, commission) => sum + parseFloat(commission.commissionAmount.toString()),
      0,
    );

    const totalAmountSold = commissions.reduce(
      (sum, commission) => sum + parseFloat(commission.orderTotal.toString()),
      0,
    );

    const totalOrders = commissions.length;

    // Aggregate products sold for the month
    const productMap = new Map<number, ProductSoldMonthlyDto>();

    for (const commission of commissions) {
      if (commission.order && commission.order.orderItems) {
        for (const orderItem of commission.order.orderItems) {
          const productId = orderItem.productId;
          const existing = productMap.get(productId);

          if (existing) {
            existing.quantity += orderItem.quantity;
            existing.totalAmount += parseFloat(orderItem.lineTotal.toString());
          } else {
            productMap.set(productId, {
              productId,
              productName: orderItem.product?.title || undefined,
              quantity: orderItem.quantity,
              totalAmount: parseFloat(orderItem.lineTotal.toString()),
            });
          }
        }
      }
    }

    const productsSold = Array.from(productMap.values());

    return {
      month,
      year,
      totalCommission,
      totalAmountSold,
      totalOrders,
      productsSold,
    };
  }
}
