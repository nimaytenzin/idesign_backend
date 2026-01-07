import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AffiliateService } from './affiliate.service';
import { AffiliateController, AffiliateMarketerController } from './affiliate.controller';
import { AffiliateCommission } from './entities/affiliate-commission.entity';
import { Order } from '../order/entities/order.entity';
import { OrderItem } from '../order/entities/order-item.entity';
import { Product } from '../product/entities/product.entity';
import { User } from '../auth/entities/user.entity';
import { AuthModule } from '../auth/auth.module';

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
  controllers: [AffiliateController, AffiliateMarketerController],
  providers: [AffiliateService],
  exports: [AffiliateService],
})
export class AffiliateModule {}

