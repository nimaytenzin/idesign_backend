import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Order } from '../../order/entities/order.entity';
import { BankAccount } from '../../bank-account/entities/bank-account.entity';
import { PaymentMethod } from '../../order/entities/order.enums';

@Table
export class PaymentReceipt extends Model<PaymentReceipt> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => Order)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  orderId: number;

  @ForeignKey(() => BankAccount)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  bankAccountId: number | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  receiptNumber: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  amount: number;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethod)),
    allowNull: false,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  paidAt: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes: string;

  @BelongsTo(() => Order)
  order: Order;

  @BelongsTo(() => BankAccount)
  bankAccount: BankAccount;
}
