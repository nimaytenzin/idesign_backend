import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Order } from '../entities/order.entity';
import { User, UserRole } from '../../auth/entities/user.entity';
import { AffiliateProfile } from '../../affiliate-marketer-management/affiliate-profile/entities/affiliate-profile.entity';

@Injectable()
export class OrderPlacementSupportService {
  private readonly logger = new Logger(OrderPlacementSupportService.name);

  constructor(
    @InjectModel(Order)
    private orderModel: typeof Order,
    @InjectModel(AffiliateProfile)
    private affiliateProfileModel: typeof AffiliateProfile,
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async generateOrderNumberInTransaction(transaction?: any): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;

    const lastOrder = await this.orderModel.findOne({
      where: {
        orderNumber: {
          [Op.like]: `${prefix}%`,
        },
      },
      order: [['orderNumber', 'DESC']],
      transaction,
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(
        lastOrder.orderNumber.replace(prefix, ''),
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  async generateInvoiceNumber(transaction?: any): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const last = await this.orderModel.findOne({
      where: { invoiceNumber: { [Op.like]: `${prefix}%` } },
      order: [['invoiceNumber', 'DESC']],
      transaction,
    });

    const sequence = last
      ? parseInt(String(last.invoiceNumber).replace(prefix, ''), 10) + 1
      : 1;
    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Link affiliate marketer to order by voucher code
   */
  async linkAffiliateMarketerByVoucherCode(
    voucherCode: string,
    transaction?: any,
  ): Promise<{ affiliateId: number; commissionPercentage: number } | null> {
    if (!voucherCode) {
      return null;
    }

    const affiliateProfile = await this.affiliateProfileModel.findOne({
      where: {
        voucherCode: voucherCode.trim().toUpperCase(),
      },
      include: [
        {
          model: User,
          as: 'user',
          where: {
            role: UserRole.AFFILIATE_MARKETER,
            isActive: true,
          },
        },
      ],
      transaction,
    });

    if (!affiliateProfile || !(affiliateProfile as any).user) {
      this.logger.debug(
        `[Affiliate Linking] No active affiliate marketer found for voucher code: ${voucherCode}`,
      );
      return null;
    }

    const user = (affiliateProfile as any).user;
    const commissionPercentage = affiliateProfile.commissionPercentage
      ? parseFloat(affiliateProfile.commissionPercentage.toString())
      : 0;

    this.logger.log(
      `[Affiliate Linking] Linked affiliate marketer ${user.id} (${user.name}) to order via voucher code: ${voucherCode}`,
    );

    return {
      affiliateId: user.id,
      commissionPercentage,
    };
  }
}
