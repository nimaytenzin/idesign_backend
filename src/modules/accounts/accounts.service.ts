import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ChartOfAccounts, AccountType } from './chart-of-accounts/entities/chart-of-accounts.entity';
import { Transaction } from './transaction/entities/transaction.entity';
import { Expense } from './expense/entities/expense.entity';
import { GeneralLedgerQueryDto } from './dto/general-ledger-query.dto';
import { GeneralLedgerResponseDto, GeneralLedgerEntry } from './dto/general-ledger-response.dto';
import { ProfitLossQueryDto } from './dto/profit-loss-query.dto';
import { ProfitLossResponseDto, RevenueAccount, ExpenseAccount } from './dto/profit-loss-response.dto';
import { Order } from '../order/entities/order.entity';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    @InjectModel(ChartOfAccounts)
    private chartOfAccountsModel: typeof ChartOfAccounts,
    @InjectModel(Transaction)
    private transactionModel: typeof Transaction,
    @InjectModel(Expense)
    private expenseModel: typeof Expense,
    @InjectModel(Order)
    private orderModel: typeof Order,
  ) {}

  // General Ledger
  async getGeneralLedger(
    query: GeneralLedgerQueryDto,
  ): Promise<GeneralLedgerResponseDto> {
    const where: any = {};
    const page = query.page || 1;
    const limit = query.limit || 100;
    const offset = (page - 1) * limit;

    // Date range filter - prioritize month/year over startDate/endDate
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (query.year && query.month) {
      // Month-wise filtering
      startDate = new Date(Date.UTC(query.year, query.month - 1, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(query.year, query.month, 0, 23, 59, 59, 999));
    } else if (query.startDate || query.endDate) {
      // Date range filtering
      if (query.startDate) {
        startDate = new Date(query.startDate);
      }
      if (query.endDate) {
        endDate = new Date(query.endDate);
      }
    }

    // Apply date filters
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date[Op.gte] = startDate;
      }
      if (endDate) {
        where.date[Op.lte] = endDate;
      }
    }

    // Account filter
    if (query.accountCode) {
      where.accountCode = query.accountCode;
    }

    // Search filter (description or reference number)
    if (query.search) {
      where[Op.or] = [
        { description: { [Op.like]: `%${query.search}%` } },
        { referenceNumber: { [Op.like]: `%${query.search}%` } },
      ];
    }

    // Get all transactions with related data
    const { rows: transactions, count: totalTransactions } =
      await this.transactionModel.findAndCountAll({
        where,
        include: [
          { model: ChartOfAccounts },
          { model: Order, required: false },
        ],
        order: [
          ['date', 'ASC'],
          ['id', 'ASC'],
        ],
        limit,
        offset,
      });

    // Get all expenses for reference
    const expenseMap = new Map<number, Expense>();
    const expenseReferences = transactions
      .map((t) => t.referenceNumber)
      .filter((ref) => ref && ref.startsWith('EXP-'));
    
    if (expenseReferences.length > 0) {
      const expenseIds = expenseReferences
        .map((ref) => parseInt(ref.replace('EXP-', '')))
        .filter((id) => !isNaN(id));
      
      if (expenseIds.length > 0) {
        const expenses = await this.expenseModel.findAll({
          where: { id: { [Op.in]: expenseIds } },
        });
        expenses.forEach((exp) => expenseMap.set(exp.id, exp));
      }
    }

    // Build ledger entries with source identification
    const entries: GeneralLedgerEntry[] = [];
    const accountBalances = new Map<string, number>();
    let totalDebits = 0;
    let totalCredits = 0;

    for (const transaction of transactions) {
      const accountCode = transaction.accountCode;
      const currentBalance = accountBalances.get(accountCode) || 0;

      // Determine source type and ID
      let sourceType: 'ORDER' | 'EXPENSE' | 'MANUAL' = 'MANUAL';
      let sourceId: number | null = null;
      let sourceReference: string | null = null;

      if (transaction.orderId) {
        sourceType = 'ORDER';
        sourceId = transaction.orderId;
        sourceReference = transaction.order?.orderNumber || null;
      } else if (
        transaction.referenceNumber &&
        transaction.referenceNumber.startsWith('EXP-')
      ) {
        sourceType = 'EXPENSE';
        const expenseId = parseInt(
          transaction.referenceNumber.replace('EXP-', ''),
        );
        if (!isNaN(expenseId)) {
          sourceId = expenseId;
          const expense = expenseMap.get(expenseId);
          sourceReference = expense?.receiptNumber || expense?.vendor || null;
        }
      }

      // Calculate running balance
      const debitAmount = parseFloat(transaction.debitAmount.toString());
      const creditAmount = parseFloat(transaction.creditAmount.toString());
      
      // Update balance based on account type
      const account = transaction.chartOfAccount;
      let newBalance = currentBalance;
      
      if (account) {
        if (account.accountType === AccountType.ASSET || 
            account.accountType === AccountType.EXPENSE) {
          // Assets and Expenses: Debit increases, Credit decreases
          newBalance = currentBalance + debitAmount - creditAmount;
        } else {
          // Liabilities, Equity, Revenue: Credit increases, Debit decreases
          newBalance = currentBalance + creditAmount - debitAmount;
        }
      } else {
        // Fallback: assume debit increases balance
        newBalance = currentBalance + debitAmount - creditAmount;
      }

      accountBalances.set(accountCode, newBalance);

      // Add to totals
      totalDebits += debitAmount;
      totalCredits += creditAmount;

      entries.push({
        id: transaction.id,
        date: transaction.date.toISOString(),
        accountCode: accountCode,
        accountName: account?.accountName || 'Unknown Account',
        description: transaction.description || '',
        debitAmount,
        creditAmount,
        balance: newBalance,
        referenceNumber: transaction.referenceNumber,
        sourceType,
        sourceId,
        sourceReference,
      });
    }

    // Build account summary
    const accountsSummary = Array.from(accountBalances.entries()).map(
      ([accountCode, balance]) => {
        const account = transactions.find(
          (t) => t.accountCode === accountCode,
        )?.chartOfAccount;
        
        const accountTransactions = transactions.filter(
          (t) => t.accountCode === accountCode,
        );
        
        const accountDebits = accountTransactions.reduce(
          (sum, t) => sum + parseFloat(t.debitAmount.toString()),
          0,
        );
        const accountCredits = accountTransactions.reduce(
          (sum, t) => sum + parseFloat(t.creditAmount.toString()),
          0,
        );

        return {
          accountCode,
          accountName: account?.accountName || 'Unknown Account',
          totalDebits: accountDebits,
          totalCredits: accountCredits,
          balance,
        };
      },
    );

    const totalPages = Math.ceil(totalTransactions / limit);

    // Determine period for response
    let periodStartDate: string | null = null;
    let periodEndDate: string | null = null;

    if (query.year && query.month) {
      periodStartDate = new Date(Date.UTC(query.year, query.month - 1, 1, 0, 0, 0, 0)).toISOString();
      periodEndDate = new Date(Date.UTC(query.year, query.month, 0, 23, 59, 59, 999)).toISOString();
    } else {
      periodStartDate = query.startDate || null;
      periodEndDate = query.endDate || null;
    }

    return {
      period: {
        startDate: periodStartDate,
        endDate: periodEndDate,
      },
      totalTransactions,
      entries,
      summary: {
        totalDebits,
        totalCredits,
        netBalance: totalDebits - totalCredits,
      },
      accounts: accountsSummary,
      pagination: {
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  // Profit & Loss (Income Statement)
  async getProfitLossStatement(
    query: ProfitLossQueryDto,
  ): Promise<ProfitLossResponseDto> {
    const where: any = {};
    const format = query.format || 'detailed';

    // Date range filter - prioritize month/year over startDate/endDate
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (query.year && query.month) {
      // Month-wise filtering
      startDate = new Date(Date.UTC(query.year, query.month - 1, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(query.year, query.month, 0, 23, 59, 59, 999));
    } else if (query.startDate || query.endDate) {
      // Date range filtering
      if (query.startDate) {
        startDate = new Date(query.startDate);
      }
      if (query.endDate) {
        endDate = new Date(query.endDate);
      }
    }

    // Apply date filters
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date[Op.gte] = startDate;
      }
      if (endDate) {
        where.date[Op.lte] = endDate;
      }
    }

    // Get all transactions with account information
    const transactions = await this.transactionModel.findAll({
      where,
      include: [{ model: ChartOfAccounts }],
      order: [['date', 'ASC']],
    });

    // Separate revenue and expense transactions
    const revenueTransactions = transactions.filter(
      (t) => t.chartOfAccount.accountType === AccountType.REVENUE && t.creditAmount > 0,
    );

    const expenseTransactions = transactions.filter(
      (t) => t.chartOfAccount.accountType === AccountType.EXPENSE && t.debitAmount > 0,
    );

    // Calculate total revenue
    const totalRevenue = revenueTransactions.reduce(
      (sum, t) => sum + parseFloat(t.creditAmount.toString()),
      0,
    );

    // Calculate total expenses
    const totalExpenses = expenseTransactions.reduce(
      (sum, t) => sum + parseFloat(t.debitAmount.toString()),
      0,
    );

    // Calculate gross profit and net income
    const grossProfit = totalRevenue;
    const netIncome = totalRevenue - totalExpenses;

    // Calculate margins
    const grossProfitMargin = totalRevenue > 0 ? 100 : 0;
    const netProfitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

    // Build revenue breakdown by account
    const revenueBreakdown: RevenueAccount[] = [];
    if (format === 'detailed') {
      const revenueByAccount = new Map<string, { account: ChartOfAccounts; transactions: Transaction[]; total: number }>();

      revenueTransactions.forEach((t) => {
        const accountCode = t.accountCode;
        if (!revenueByAccount.has(accountCode)) {
          revenueByAccount.set(accountCode, {
            account: t.chartOfAccount,
            transactions: [],
            total: 0,
          });
        }
        const accountData = revenueByAccount.get(accountCode)!;
        accountData.transactions.push(t);
        accountData.total += parseFloat(t.creditAmount.toString());
      });

      revenueByAccount.forEach(({ account, transactions: accountTransactions, total }) => {
        revenueBreakdown.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          amount: total,
          transactions: format === 'detailed' ? accountTransactions : undefined,
        });
      });
    }

    // Build expense breakdown by account
    const expenseBreakdown: ExpenseAccount[] = [];
    if (format === 'detailed') {
      const expenseByAccount = new Map<string, { account: ChartOfAccounts; transactions: Transaction[]; total: number }>();

      expenseTransactions.forEach((t) => {
        const accountCode = t.accountCode;
        if (!expenseByAccount.has(accountCode)) {
          expenseByAccount.set(accountCode, {
            account: t.chartOfAccount,
            transactions: [],
            total: 0,
          });
        }
        const accountData = expenseByAccount.get(accountCode)!;
        accountData.transactions.push(t);
        accountData.total += parseFloat(t.debitAmount.toString());
      });

      expenseByAccount.forEach(({ account, transactions: accountTransactions, total }) => {
        expenseBreakdown.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          amount: total,
          transactions: format === 'detailed' ? accountTransactions : undefined,
        });
      });
    }

    // Determine period for response
    let periodStartDate: string | null = null;
    let periodEndDate: string | null = null;

    if (query.year && query.month) {
      periodStartDate = new Date(Date.UTC(query.year, query.month - 1, 1, 0, 0, 0, 0)).toISOString();
      periodEndDate = new Date(Date.UTC(query.year, query.month, 0, 23, 59, 59, 999)).toISOString();
    } else {
      periodStartDate = query.startDate || null;
      periodEndDate = query.endDate || null;
    }

    return {
      period: {
        startDate: periodStartDate,
        endDate: periodEndDate,
      },
      revenue: {
        total: totalRevenue,
        breakdown: format === 'detailed' ? revenueBreakdown : undefined,
      },
      expenses: {
        total: totalExpenses,
        breakdown: format === 'detailed' ? expenseBreakdown : undefined,
      },
      grossProfit,
      grossProfitMargin: Math.round(grossProfitMargin * 100) / 100,
      netIncome,
      netProfitMargin: Math.round(netProfitMargin * 100) / 100,
    };
  }

  /**
   * Create accounting entries for an order payment
   * Called by order service when an order is paid
   */
  async createAccountingEntriesForOrder(order: Order): Promise<void> {
    // Check if transactions already exist for this order to prevent duplicates
    const existingTransactions = await this.transactionModel.findAll({
      where: { orderId: order.id },
    });

    if (existingTransactions.length > 0) {
      this.logger.debug(
        `Accounting entries already exist for order ${order.id}, skipping creation`,
      );
      return;
    }

    // Get or create default accounts
    const cashAccount = await this.getOrCreateAccount('1010', 'Cash', 'ASSET', 'DEBIT');
    const revenueAccount = await this.getOrCreateAccount('4000', 'Sales Revenue', 'REVENUE', 'CREDIT');

    const paymentDate = order.paidAt || new Date();

    // Transaction 1: Debit Cash
    await this.transactionModel.create({
      accountCode: cashAccount.accountCode,
      orderId: order.id,
      date: paymentDate,
      debitAmount: order.totalPayable,
      creditAmount: 0,
      description: `Payment received for Order ${order.orderNumber}`,
      referenceNumber: order.receiptNumber || order.orderNumber,
    });

    // Transaction 2: Credit Sales Revenue
    await this.transactionModel.create({
      accountCode: revenueAccount.accountCode,
      orderId: order.id,
      date: paymentDate,
      debitAmount: 0,
      creditAmount: order.totalPayable,
      description: `Sales revenue from Order ${order.orderNumber}`,
      referenceNumber: order.receiptNumber || order.orderNumber,
    });
  }

  /**
   * Create reversal accounting entries for a cancelled order
   * Called by order service when an order is cancelled
   */
  async createReversalEntriesForOrder(order: Order, reason?: string): Promise<void> {
    if (!order.receiptGenerated) {
      return; // No accounting entries to reverse
    }

    const cashAccount = await this.getOrCreateAccount('1010', 'Cash', 'ASSET', 'DEBIT');
    const revenueAccount = await this.getOrCreateAccount('4000', 'Sales Revenue', 'REVENUE', 'CREDIT');

    // Reversal Transaction 1: Debit Sales Revenue (to reduce income)
    await this.transactionModel.create({
      accountCode: revenueAccount.accountCode,
      orderId: order.id,
      date: new Date(),
      debitAmount: order.totalPayable,
      creditAmount: 0,
      description: `Refund issued for Order ${order.orderNumber}${reason ? `: ${reason}` : ''}`,
      referenceNumber: `REV-${order.receiptNumber}`,
    });

    // Reversal Transaction 2: Credit Cash (to reduce asset)
    await this.transactionModel.create({
      accountCode: cashAccount.accountCode,
      orderId: order.id,
      date: new Date(),
      debitAmount: 0,
      creditAmount: order.totalPayable,
      description: `Refund issued for Order ${order.orderNumber}${reason ? `: ${reason}` : ''}`,
      referenceNumber: `REV-${order.receiptNumber}`,
    });
  }

  /**
   * Get or create a chart of accounts entry
   * Helper method for creating default accounts
   */
  async getOrCreateAccount(
    accountCode: string,
    accountName: string,
    accountType: string,
    normalBalance: string,
  ): Promise<ChartOfAccounts> {
    let account = await this.chartOfAccountsModel.findByPk(accountCode);

    if (!account) {
      account = await this.chartOfAccountsModel.create({
        accountCode,
        accountName,
        accountType: accountType as any,
        normalBalance: normalBalance as any,
        description: `Default ${accountName} account`,
        isActive: true,
      });
    }

    return account;
  }
}
