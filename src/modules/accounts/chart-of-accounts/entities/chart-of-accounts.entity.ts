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
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
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

