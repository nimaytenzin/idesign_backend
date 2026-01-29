import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PaymentReceipt } from './entities/payment-receipt.entity';
import { Order } from '../order/entities/order.entity';
import { BankAccount } from '../bank-account/entities/bank-account.entity';
import { PaymentReceiptService } from './payment-receipt.service';
import { PaymentReceiptController } from './payment-receipt.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([PaymentReceipt, Order, BankAccount]),
  ],
  controllers: [PaymentReceiptController],
  providers: [PaymentReceiptService],
  exports: [PaymentReceiptService],
})
export class PaymentReceiptModule {}
