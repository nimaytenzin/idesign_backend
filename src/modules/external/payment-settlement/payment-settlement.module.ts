import { Module, forwardRef } from '@nestjs/common';
import { PaymentSettlementService } from './payment-settlement.service';
import { PaymentSettlementController } from './payment-settlement.controller';
import { HttpModule } from '@nestjs/axios';
import { OrderModule } from '../../order/order.module';

@Module({
  controllers: [PaymentSettlementController],
  providers: [PaymentSettlementService],
  imports: [HttpModule, forwardRef(() => OrderModule)],
  exports: [PaymentSettlementService],
})
export class PaymentSettlementModule {}
