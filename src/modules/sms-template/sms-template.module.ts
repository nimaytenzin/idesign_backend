import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CqrsModule } from '@nestjs/cqrs';
import { SmsTemplate } from './entities/sms-template.entity';
import { SmsTemplateService } from './services/sms-template.service';
import { SmsTriggerService } from './services/sms-trigger.service';
import { SmsTemplateController } from './sms-template.controller';
import { Order } from '../order/entities/order.entity';
import { Outbox } from '../outbox/entities/outbox.entity';
import { Customer } from '../customer/entities/customer.entity';
import { OrderModule } from '../order/order.module';
import { OutboxModule } from '../outbox/outbox.module';
import { CustomerModule } from '../customer/customer.module';

@Module({
  imports: [
    SequelizeModule.forFeature([SmsTemplate, Order, Outbox, Customer]),
    CqrsModule,
    forwardRef(() => OrderModule), // Use forwardRef to avoid circular dependency
    OutboxModule,
    CustomerModule,
  ],
  controllers: [SmsTemplateController],
  providers: [SmsTemplateService, SmsTriggerService],
  exports: [SmsTemplateService, SmsTriggerService],
})
export class SmsTemplateModule {}
