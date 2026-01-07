import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import * as bcrypt from 'bcrypt';
import { AffiliateCommission } from './entities/affiliate-commission.entity';
import { Order } from '../order/entities/order.entity';
import { OrderItem } from '../order/entities/order-item.entity';
import { Product } from '../product/entities/product.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { AffiliateCommissionResponseDto } from './dto/affiliate-commission-response.dto';
import { AffiliateStatsResponseDto, ProductSoldDto } from './dto/affiliate-stats-response.dto';
import { MonthlyReportResponseDto, ProductSoldMonthlyDto } from './dto/monthly-report-response.dto';
import { MonthlyReportQueryDto } from './dto/monthly-report-query.dto';
import { CreateAffiliateMarketerDto } from './dto/create-affiliate-marketer.dto';
import { AffiliateMarketerResponseDto } from './dto/affiliate-marketer-response.dto';

@Injectable()
export class AffiliateService {
  constructor(
    @InjectModel(AffiliateCommission)
    private affiliateCommissionModel: typeof AffiliateCommission,
    @InjectModel(Order)
    private orderModel: typeof Order,
    @InjectModel(OrderItem)
    private orderItemModel: typeof OrderItem,
    @InjectModel(Product)
    private productModel: typeof Product,
    @InjectModel(User)
    private userModel: typeof User,
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

  async createAffiliateMarketer(
    createDto: CreateAffiliateMarketerDto,
  ): Promise<User> {
    // Check if user already exists by CID
    const existingUserByCid = await this.userModel.findOne({
      where: { cid: createDto.cid },
    });

    if (existingUserByCid) {
      throw new ConflictException('User with this CID already exists');
    }

    // Check if user already exists by email
    const existingUserByEmail = await this.userModel.findOne({
      where: { emailAddress: createDto.email },
    });

    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if voucher code is already taken
    const existingVoucherCode = await this.userModel.findOne({
      where: { voucherCode: createDto.voucherCode },
    });

    if (existingVoucherCode) {
      throw new ConflictException('Voucher code is already taken');
    }

    // Validate percentages
    if (createDto.discountPercentage < 0 || createDto.discountPercentage > 100) {
      throw new BadRequestException('Discount percentage must be between 0 and 100');
    }

    if (createDto.commissionPercentage < 0 || createDto.commissionPercentage > 100) {
      throw new BadRequestException('Commission percentage must be between 0 and 100');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createDto.password, 10);

    // Create affiliate marketer user
    const user = await this.userModel.create({
      name: createDto.name,
      cid: createDto.cid,
      emailAddress: createDto.email,
      phoneNumber: createDto.phoneNumber,
      password: hashedPassword,
      role: UserRole.AFFILIATE_MARKETER,
      isActive: true,
      voucherCode: createDto.voucherCode,
      discountPercentage: createDto.discountPercentage,
      commissionPercentage: createDto.commissionPercentage,
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword as User;
  }

  async getAllAffiliateMarketers(): Promise<AffiliateMarketerResponseDto[]> {
    const affiliateMarketers = await this.userModel.findAll({
      where: {
        role: UserRole.AFFILIATE_MARKETER,
      },
      attributes: [
        'id',
        'name',
        'cid',
        'emailAddress',
        'phoneNumber',
        'isActive',
        'voucherCode',
        'discountPercentage',
        'commissionPercentage',
        'createdAt',
        'updatedAt',
      ],
      order: [['createdAt', 'DESC']],
    });

    return affiliateMarketers.map((user) => ({
      id: user.id,
      name: user.name,
      cid: user.cid,
      emailAddress: user.emailAddress,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
      voucherCode: user.voucherCode,
      discountPercentage: user.discountPercentage
        ? parseFloat(user.discountPercentage.toString())
        : null,
      commissionPercentage: user.commissionPercentage
        ? parseFloat(user.commissionPercentage.toString())
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }
}

