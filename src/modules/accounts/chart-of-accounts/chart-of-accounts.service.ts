import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChartOfAccounts, AccountType, AccountSubType } from './entities/chart-of-accounts.entity';
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

  /**
   * Validate that account subtype matches account type
   */
  private validateAccountSubType(
    accountType: AccountType,
    accountSubType?: AccountSubType,
  ): void {
    if (!accountSubType) {
      return; // Subtype is optional
    }

    const validSubTypes: Record<AccountType, AccountSubType[]> = {
      [AccountType.ASSET]: [
        AccountSubType.CURRENT_ASSET,
        AccountSubType.NON_CURRENT_ASSET,
        AccountSubType.FIXED_ASSET,
        AccountSubType.INVENTORY,
      ],
      [AccountType.LIABILITY]: [
        AccountSubType.CURRENT_LIABILITY,
        AccountSubType.NON_CURRENT_LIABILITY,
        AccountSubType.LONG_TERM_DEBT,
      ],
      [AccountType.EQUITY]: [
        AccountSubType.OWNERS_EQUITY,
        AccountSubType.RETAINED_EARNINGS,
        AccountSubType.CAPITAL_STOCK,
      ],
      [AccountType.REVENUE]: [
        AccountSubType.OPERATING_REVENUE,
        AccountSubType.NON_OPERATING_REVENUE,
        AccountSubType.OTHER_INCOME,
      ],
      [AccountType.EXPENSE]: [
        AccountSubType.OPERATING_EXPENSE,
        AccountSubType.COST_OF_GOODS_SOLD,
        AccountSubType.ADMINISTRATIVE_EXPENSE,
        AccountSubType.FINANCIAL_EXPENSE,
        AccountSubType.OTHER_EXPENSE,
      ],
    };

    const validSubTypesForType = validSubTypes[accountType];
    if (!validSubTypesForType.includes(accountSubType)) {
      throw new BadRequestException(
        `Account subtype ${accountSubType} is not valid for account type ${accountType}. ` +
        `Valid subtypes for ${accountType} are: ${validSubTypesForType.join(', ')}`,
      );
    }
  }

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

    // Validate account subtype matches account type
    this.validateAccountSubType(
      createChartOfAccountsDto.accountType,
      createChartOfAccountsDto.accountSubType,
    );

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
    
    // Determine account type (use updated value if provided, otherwise existing)
    const accountType = updateChartOfAccountsDto.accountType ?? account.accountType;
    const accountSubType = updateChartOfAccountsDto.accountSubType ?? account.accountSubType;
    
    // Validate account subtype matches account type
    if (updateChartOfAccountsDto.accountSubType !== undefined || updateChartOfAccountsDto.accountType !== undefined) {
      this.validateAccountSubType(accountType, accountSubType);
    }
    
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

