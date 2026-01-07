import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChartOfAccounts } from './entities/chart-of-accounts.entity';
import { CreateChartOfAccountsDto } from './dto/create-chart-of-accounts.dto';
import { UpdateChartOfAccountsDto } from './dto/update-chart-of-accounts.dto';
import { Transaction } from '../transaction/entities/transaction.entity';

@Injectable()
export class ChartOfAccountsService {
  constructor(
    @InjectModel(ChartOfAccounts)
    private chartOfAccountsModel: typeof ChartOfAccounts,
    @InjectModel(Transaction)
    private transactionModel: typeof Transaction,
  ) {}

  async create(
    createChartOfAccountsDto: CreateChartOfAccountsDto,
  ): Promise<ChartOfAccounts> {
    const existing = await this.chartOfAccountsModel.findByPk(
      createChartOfAccountsDto.accountCode,
    );
    if (existing) {
      throw new BadRequestException(
        `Account code ${createChartOfAccountsDto.accountCode} already exists`,
      );
    }

    return this.chartOfAccountsModel.create(createChartOfAccountsDto);
  }

  async findAll(): Promise<ChartOfAccounts[]> {
    return this.chartOfAccountsModel.findAll({
      order: [['accountCode', 'ASC']],
    });
  }

  async findOne(accountCode: string): Promise<ChartOfAccounts> {
    const account = await this.chartOfAccountsModel.findByPk(accountCode);
    if (!account) {
      throw new NotFoundException('Chart of account not found');
    }
    return account;
  }

  async update(
    accountCode: string,
    updateChartOfAccountsDto: UpdateChartOfAccountsDto,
  ): Promise<ChartOfAccounts> {
    const account = await this.findOne(accountCode);
    await account.update(updateChartOfAccountsDto);
    return this.findOne(accountCode);
  }

  async remove(accountCode: string): Promise<void> {
    const account = await this.findOne(accountCode);

    const transactionCount = await this.transactionModel.count({
      where: { accountCode },
    });

    if (transactionCount > 0) {
      throw new BadRequestException(
        'Cannot delete account with existing transactions. Deactivate instead.',
      );
    }

    await account.destroy();
  }
}

