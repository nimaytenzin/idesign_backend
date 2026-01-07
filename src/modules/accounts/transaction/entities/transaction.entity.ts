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
import { Order } from '../../../order/entities/order.entity';

@Table
export class Transaction extends Model<Transaction> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => ChartOfAccounts)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  accountCode: string;

  @ForeignKey(() => Order)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  orderId: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  date: Date;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  debitAmount: number;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  creditAmount: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  referenceNumber: string;

  @BelongsTo(() => ChartOfAccounts)
  chartOfAccount: ChartOfAccounts;

  @BelongsTo(() => Order)
  order: Order;
}

