import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  HasMany,
  Default,
} from 'sequelize-typescript';
import { OrderItem } from './order-item.entity';
import { OrderDiscount } from './order-discount.entity';
import { Transaction } from '../../accounts/transaction/entities/transaction.entity';
import { Customer } from 'src/modules/customer/entities/customer.entity';
import { User } from '../../auth/entities/user.entity';
import { AffiliateCommission } from '../../affiliate/entities/affiliate-commission.entity';
import {
  FulfillmentStatus,
  PaymentStatus,
  AffiliatePaymentStatus,
  PaymentMethod,
  OrderType,
} from './order.enums';

export {
  FulfillmentStatus,
  PaymentStatus,
  AffiliatePaymentStatus,
  PaymentMethod,
  OrderType,
} from './order.enums';

@Table
export class Order extends Model<Order> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  orderNumber: string;

  @ForeignKey(() => Customer)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  customerId: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  orderDate: Date;

  @Column({
    type: DataType.ENUM(...Object.values(OrderType)),
    allowNull: false,
    defaultValue: OrderType.ONLINE,
  })
  orderType: OrderType;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  totalAmount: number;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  orderDiscount: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  voucherCode: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  feedbackToken: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  lastUpdated: Date;

  @Column({
    type: DataType.ENUM(...Object.values(FulfillmentStatus)),
    allowNull: false,
    defaultValue: FulfillmentStatus.PLACED,
  })
  fulfillmentStatus: FulfillmentStatus;

  // Fulfillment status timestamps
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  placedAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  confirmedAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  processingAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  shippingAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deliveredAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  canceledAt: Date;

  // Delivery driver information (for SHIPPING status)
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  driverName: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  driverPhone: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  vehicleNumber: string;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentStatus)),
    allowNull: false,
    defaultValue: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  paymentDate: Date;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethod)),
    allowNull: true,
  })
  paymentMethod: PaymentMethod;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  receiptGenerated: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  receiptNumber: string;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  shippingCost: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  internalNotes: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  paidAt: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  referrerSource: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  affiliateId: number;

  @BelongsTo(() => Customer)
  customer: Customer;

  @BelongsTo(() => User)
  affiliate: User;

  @HasMany(() => OrderItem)
  orderItems: OrderItem[];

  @HasMany(() => OrderDiscount)
  orderDiscounts: OrderDiscount[];

  @HasMany(() => Transaction)
  transactions: Transaction[];

  @HasMany(() => AffiliateCommission)
  affiliateCommissions: AffiliateCommission[];
}

