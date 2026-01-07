import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  Default,
} from 'sequelize-typescript';
import { ChartOfAccounts } from '../../chart-of-accounts/entities/chart-of-accounts.entity';

export enum PaymentMethod {
  CASH = 'CASH',
  MBOB = 'MBOB',
  BDB_EPAY = 'BDB_EPAY',
  TPAY = 'TPAY',
  BNB_MPAY = 'BNB_MPAY',
  ZPSS = 'ZPSS',
}

@Table({
  tableName: 'expenses',
  timestamps: true,
})
export class Expense extends Model<Expense> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  expenseDate: Date;

  @ForeignKey(() => ChartOfAccounts)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  accountCode: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  amount: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  vendor: string;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethod)),
    allowNull: false,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  receiptNumber: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  receiptAttachment: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  category: string;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isPosted: boolean;

  @ForeignKey(() => ChartOfAccounts)
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  cashAccountCode: string;

  @BelongsTo(() => ChartOfAccounts, 'accountCode')
  expenseAccount?: ChartOfAccounts;

  @BelongsTo(() => ChartOfAccounts, 'cashAccountCode')
  cashAccount?: ChartOfAccounts;
}

