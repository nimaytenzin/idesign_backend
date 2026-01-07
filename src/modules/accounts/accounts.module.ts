import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { ChartOfAccounts } from './chart-of-accounts/entities/chart-of-accounts.entity';
import { Transaction } from './transaction/entities/transaction.entity';
import { Expense } from './expense/entities/expense.entity';
import { Order } from '../order/entities/order.entity';
import { ChartOfAccountsModule } from './chart-of-accounts/chart-of-accounts.module';
import { TransactionModule } from './transaction/transaction.module';
import { ExpenseModule } from './expense/expense.module';

@Module({
  imports: [
    SequelizeModule.forFeature([ChartOfAccounts, Transaction, Expense, Order]),
    ChartOfAccountsModule,
    TransactionModule,
    ExpenseModule,
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
