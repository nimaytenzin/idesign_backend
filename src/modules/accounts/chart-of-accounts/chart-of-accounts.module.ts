import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { ChartOfAccountsController } from './chart-of-accounts.controller';
import { ChartOfAccounts } from './entities/chart-of-accounts.entity';
import { Transaction } from '../transaction/entities/transaction.entity';

@Module({
  imports: [SequelizeModule.forFeature([ChartOfAccounts, Transaction])],
  controllers: [ChartOfAccountsController],
  providers: [ChartOfAccountsService],
  exports: [ChartOfAccountsService],
})
export class ChartOfAccountsModule {}

