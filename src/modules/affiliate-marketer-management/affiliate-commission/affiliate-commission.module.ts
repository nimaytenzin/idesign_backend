import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AffiliateCommissionService } from './affiliate-commission.service';
import { AffiliateCommissionController } from './affiliate-commission.controller';
import { AffiliateCommission } from './entities/affiliate-commission.entity';
import { Order } from '../../order/entities/order.entity';
import { OrderItem } from '../../order/entities/order-item.entity';
import { Product } from '../../product/entities/product.entity';
import { User } from '../../auth/entities/user.entity';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      AffiliateCommission,
      Order,
      OrderItem,
      Product,
      User,
    ]),
    AuthModule,
  ],
  controllers: [AffiliateCommissionController],
  providers: [AffiliateCommissionService],
  exports: [AffiliateCommissionService],
})
export class AffiliateCommissionModule {}
