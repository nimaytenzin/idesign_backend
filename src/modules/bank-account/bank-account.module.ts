import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BankAccount } from './entities/bank-account.entity';
import { BankAccountService } from './bank-account.service';
import { BankAccountController } from './bank-account.controller';

@Module({
  imports: [SequelizeModule.forFeature([BankAccount])],
  controllers: [BankAccountController],
  providers: [BankAccountService],
  exports: [BankAccountService, SequelizeModule],
})
export class BankAccountModule {}
