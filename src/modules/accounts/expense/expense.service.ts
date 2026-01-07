import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Expense, PaymentMethod } from './entities/expense.entity';
import { ChartOfAccounts, AccountType } from '../chart-of-accounts/entities/chart-of-accounts.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { ChartOfAccountsService } from '../chart-of-accounts/chart-of-accounts.service';
import { Transaction } from '../transaction/entities/transaction.entity';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectModel(Expense)
    private expenseModel: typeof Expense,
    @InjectModel(ChartOfAccounts)
    private chartOfAccountsModel: typeof ChartOfAccounts,
    @InjectModel(Transaction)
    private transactionModel: typeof Transaction,
    private chartOfAccountsService: ChartOfAccountsService,
  ) {}

  async create(createExpenseDto: CreateExpenseDto): Promise<Expense> {
    // Validate expense account exists and is an EXPENSE type
    const expenseAccount = await this.chartOfAccountsService.findOne(
      createExpenseDto.accountCode,
    );

    if (expenseAccount.accountType !== AccountType.EXPENSE) {
      throw new BadRequestException(
        'Account code must be an EXPENSE type account',
      );
    }

    // Get or determine cash account
    let cashAccountCode = createExpenseDto.cashAccountCode;
    if (!cashAccountCode) {
      // Default cash account based on payment method
      cashAccountCode = await this.getCashAccountByPaymentMethod(
        createExpenseDto.paymentMethod,
      );
    }

    // Validate cash account exists and is an ASSET type
    const cashAccount = await this.chartOfAccountsService.findOne(cashAccountCode);
    if (cashAccount.accountType !== AccountType.ASSET) {
      throw new BadRequestException(
        'Cash account must be an ASSET type account',
      );
    }

    const expense = await this.expenseModel.create({
      ...createExpenseDto,
      expenseDate: new Date(createExpenseDto.expenseDate),
      cashAccountCode,
      isPosted: false,
    });

    // Auto-post to ledger if requested
    if (createExpenseDto.autoPost) {
      await this.postToLedger(expense.id);
    }

    return this.findOne(expense.id);
  }

  async findAll(query?: ExpenseQueryDto): Promise<Expense[]> {
    const where: any = {};

    if (query?.startDate || query?.endDate) {
      where.expenseDate = {};
      if (query.startDate) {
        where.expenseDate[Op.gte] = new Date(query.startDate);
      }
      if (query.endDate) {
        where.expenseDate[Op.lte] = new Date(query.endDate);
      }
    }

    if (query?.accountCode) {
      where.accountCode = query.accountCode;
    }

    if (query?.category) {
      where.category = query.category;
    }

    if (query?.vendor) {
      where.vendor = { [Op.like]: `%${query.vendor}%` };
    }

    if (query?.paymentMethod) {
      where.paymentMethod = query.paymentMethod;
    }

    if (query?.isPosted !== undefined) {
      where.isPosted = query.isPosted;
    }

    return this.expenseModel.findAll({
      where,
      include: [{ model: ChartOfAccounts }],
      order: [['expenseDate', 'DESC']],
    });
  }

  async findOne(id: number): Promise<Expense> {
    const expense = await this.expenseModel.findByPk(id, {
      include: [{ model: ChartOfAccounts }],
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async update(id: number, updateExpenseDto: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.findOne(id);

    if (expense.isPosted) {
      throw new BadRequestException(
        'Cannot update a posted expense. Reverse it first if needed.',
      );
    }

    // Validate account if being updated
    if (updateExpenseDto.accountCode) {
      const account = await this.chartOfAccountsService.findOne(
        updateExpenseDto.accountCode,
      );
      if (account.accountType !== AccountType.EXPENSE) {
        throw new BadRequestException(
          'Account code must be an EXPENSE type account',
        );
      }
    }

    const updateData: any = { ...updateExpenseDto };
    if (updateExpenseDto.expenseDate) {
      updateData.expenseDate = new Date(updateExpenseDto.expenseDate);
    }

    await expense.update(updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const expense = await this.findOne(id);

    if (expense.isPosted) {
      throw new BadRequestException(
        'Cannot delete a posted expense. Reverse it first if needed.',
      );
    }

    await expense.destroy();
  }

  async postToLedger(id: number): Promise<Expense> {
    const expense = await this.findOne(id);

    if (expense.isPosted) {
      throw new BadRequestException('Expense is already posted to ledger');
    }

    // Create double-entry transaction
    // Debit: Expense Account
    await this.transactionModel.create({
      accountCode: expense.accountCode,
      date: expense.expenseDate,
      debitAmount: expense.amount,
      creditAmount: 0,
      description: expense.description || `Expense: ${expense.vendor || 'N/A'}`,
      referenceNumber: expense.receiptNumber || `EXP-${expense.id}`,
    });

    // Credit: Cash Account
    await this.transactionModel.create({
      accountCode: expense.cashAccountCode,
      date: expense.expenseDate,
      debitAmount: 0,
      creditAmount: expense.amount,
      description: `Payment for: ${expense.description || expense.vendor || 'N/A'}`,
      referenceNumber: expense.receiptNumber || `EXP-${expense.id}`,
    });

    // Mark expense as posted
    await expense.update({ isPosted: true });

    return this.findOne(id);
  }

  // Helper method to get cash account by payment method
  private async getCashAccountByPaymentMethod(
    paymentMethod: PaymentMethod,
  ): Promise<string> {
    // Map payment methods to default cash accounts
    const accountMap: { [key in PaymentMethod]?: string } = {
      [PaymentMethod.CASH]: '1010', // Cash
      [PaymentMethod.MBOB]: '1020', // Bank Account - MBOB
      [PaymentMethod.BDB_EPAY]: '1021', // Bank Account - BDB
      [PaymentMethod.TPAY]: '1022', // Bank Account - TPay
      [PaymentMethod.BNB_MPAY]: '1023', // Bank Account - BNB
      [PaymentMethod.ZPSS]: '1024', // Bank Account - ZPSS
    };

    const defaultAccountCode = accountMap[paymentMethod] || '1010';

    // Check if account exists, if not return default
    const account = await this.chartOfAccountsModel.findByPk(defaultAccountCode);
    if (!account) {
      // Return first available cash/asset account or throw error
      const cashAccount = await this.chartOfAccountsModel.findOne({
        where: {
          accountType: AccountType.ASSET,
          accountCode: { [Op.like]: '1%' }, // Asset accounts typically start with 1
        },
      });

      if (!cashAccount) {
        throw new NotFoundException(
          'No cash account found. Please create an asset account first.',
        );
      }

      return cashAccount.accountCode;
    }

    return defaultAccountCode;
  }
}

