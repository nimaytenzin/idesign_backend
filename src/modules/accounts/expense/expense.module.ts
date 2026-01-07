import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ExpenseService } from './expense.service';
import { ExpenseController } from './expense.controller';
import { Expense } from './entities/expense.entity';
import { ChartOfAccountsModule } from '../chart-of-accounts/chart-of-accounts.module';
import { Transaction } from '../transaction/entities/transaction.entity';
import { ChartOfAccounts } from '../chart-of-accounts/entities/chart-of-accounts.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([Expense, Transaction, ChartOfAccounts]),
    ChartOfAccountsModule,
  ],
  controllers: [ExpenseController],
  providers: [ExpenseService],
  exports: [ExpenseService],
})
export class ExpenseModule {}

