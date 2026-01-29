import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScheduleModule } from '@nestjs/schedule';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderDiscount } from './entities/order-discount.entity';
import { Product } from '../product/entities/product.entity';
import { PaymentReceiptModule } from '../payment-receipt/payment-receipt.module';
import { Customer } from '../customer/entities/customer.entity';
import { User } from '../auth/entities/user.entity';
import { AffiliateCommission } from '../affiliate-marketer-management/affiliate-commission/entities/affiliate-commission.entity';
import { AffiliateProfile } from '../affiliate-marketer-management/affiliate-profile/entities/affiliate-profile.entity';
import { CustomerModule } from '../customer/customer.module';
import { SmsModule } from '../external/sms/sms.module';
import { PaymentSettlementModule } from '../external/payment-settlement/payment-settlement.module';

// Supporting Services
import { OrderSchedulerService } from './services/order-scheduler.service';
import { SmsTemplateModule } from '../sms-template/sms-template.module';
import { DiscountModule } from '../discount/discount.module';
import { PaginationModule } from '../../common/pagination/pagination.module';

@Module({
  imports: [
    forwardRef(() => PaymentSettlementModule),
    SequelizeModule.forFeature([
      Order,
      OrderItem,
      OrderDiscount,
      Product,
      Customer,
      User,
      AffiliateCommission,
      AffiliateProfile,
    ]),
    ScheduleModule.forRoot(),
    PaymentReceiptModule,
    CustomerModule,
    SmsModule,
    SmsTemplateModule,
    DiscountModule,
    PaginationModule,
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderSchedulerService,
  ],
  exports: [OrderService],
})
export class OrderModule implements OnModuleInit {
  onModuleInit() {
    // Module initialized
  }
}
