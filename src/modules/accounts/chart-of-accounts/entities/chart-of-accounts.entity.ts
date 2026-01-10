import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  HasMany,
  Default,
} from 'sequelize-typescript';
import { Transaction } from '../../transaction/entities/transaction.entity';

export enum AccountType {
  ASSET = 'ASSET',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
}

export enum AccountSubType {
  // Asset Subtypes
  CURRENT_ASSET = 'CURRENT_ASSET',
  NON_CURRENT_ASSET = 'NON_CURRENT_ASSET',
  FIXED_ASSET = 'FIXED_ASSET',
  INVENTORY = 'INVENTORY',
  
  // Liability Subtypes
  CURRENT_LIABILITY = 'CURRENT_LIABILITY',
  NON_CURRENT_LIABILITY = 'NON_CURRENT_LIABILITY',
  LONG_TERM_DEBT = 'LONG_TERM_DEBT',
  
  // Equity Subtypes
  OWNERS_EQUITY = 'OWNERS_EQUITY',
  RETAINED_EARNINGS = 'RETAINED_EARNINGS',
  CAPITAL_STOCK = 'CAPITAL_STOCK',
  
  // Revenue Subtypes
  OPERATING_REVENUE = 'OPERATING_REVENUE',
  NON_OPERATING_REVENUE = 'NON_OPERATING_REVENUE',
  OTHER_INCOME = 'OTHER_INCOME',
  
  // Expense Subtypes
  OPERATING_EXPENSE = 'OPERATING_EXPENSE',
  COST_OF_GOODS_SOLD = 'COST_OF_GOODS_SOLD',
  ADMINISTRATIVE_EXPENSE = 'ADMINISTRATIVE_EXPENSE',
  FINANCIAL_EXPENSE = 'FINANCIAL_EXPENSE',
  OTHER_EXPENSE = 'OTHER_EXPENSE',
}

export enum NormalBalance {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

@Table
export class ChartOfAccounts extends Model<ChartOfAccounts> {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  accountCode: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  accountName: string;

  @Column({
    type: DataType.ENUM(...Object.values(AccountType)),
    allowNull: false,
  })
  accountType: AccountType;

  @Column({
    type: DataType.ENUM(...Object.values(AccountSubType)),
    allowNull: true,
  })
  accountSubType: AccountSubType;

  @Column({
    type: DataType.ENUM(...Object.values(NormalBalance)),
    allowNull: false,
  })
  normalBalance: NormalBalance;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive: boolean;

  @HasMany(() => Transaction)
  transactions: Transaction[];
}

