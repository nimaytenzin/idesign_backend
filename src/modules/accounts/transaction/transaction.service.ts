import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from './entities/transaction.entity';
import { ChartOfAccounts } from '../chart-of-accounts/entities/chart-of-accounts.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ChartOfAccountsService } from '../chart-of-accounts/chart-of-accounts.service';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction)
    private transactionModel: typeof Transaction,
    private chartOfAccountsService: ChartOfAccountsService,
  ) {}

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    // Validate account exists
    await this.chartOfAccountsService.findOne(createTransactionDto.accountCode);

    if (
      createTransactionDto.debitAmount === 0 &&
      createTransactionDto.creditAmount === 0
    ) {
      throw new BadRequestException(
        'At least one of debitAmount or creditAmount must be greater than 0',
      );
    }

    if (
      createTransactionDto.debitAmount > 0 &&
      createTransactionDto.creditAmount > 0
    ) {
      throw new BadRequestException(
        'DebitAmount and CreditAmount cannot both be greater than 0',
      );
    }

    const transactionData: any = {
      ...createTransactionDto,
      date: createTransactionDto.date
        ? new Date(createTransactionDto.date)
        : new Date(),
    };

    return this.transactionModel.create(transactionData);
  }

  async findAll(): Promise<Transaction[]> {
    return this.transactionModel.findAll({
      include: [{ model: ChartOfAccounts }],
      order: [['date', 'DESC']],
    });
  }

  async findOne(id: number): Promise<Transaction> {
    const transaction = await this.transactionModel.findByPk(id, {
      include: [{ model: ChartOfAccounts }],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }
}

