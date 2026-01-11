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
import { AffiliateCommission } from '../../affiliate-marketer-management/affiliate-commission/entities/affiliate-commission.entity';
import { DeliveryRate } from '../../delivery/delivery-rate/entities/delivery-rate.entity';
import {
  FulfillmentStatus,
  PaymentStatus,
  PaymentMethod,
  FulfillmentType,
  OrderSource,
} from './order.enums';

@Table
export class Order extends Model<Order> {
  // ============================================
  // Basic Information
  // ============================================
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

  // ============================================
  // Order Classification
  // ============================================
  @Column({
    type: DataType.ENUM(...Object.values(OrderSource)),
    allowNull: false,
    defaultValue: OrderSource.ONLINE,
  })
  orderSource: OrderSource;

  @Column({
    type: DataType.ENUM(...Object.values(FulfillmentStatus)),
    allowNull: false,
    defaultValue: FulfillmentStatus.PLACED,
  })
  fulfillmentStatus: FulfillmentStatus;

  @Column({
    type: DataType.ENUM(...Object.values(FulfillmentType)),
    allowNull: false,
    defaultValue: FulfillmentType.DELIVERY,
  })
  fulfillmentType: FulfillmentType;

  // ============================================
  // Financial Information
  // ============================================
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  subTotal: number;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  discount: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  totalPayable: number;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  deliveryCost: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  voucherCode: string;

  // ============================================
  // Fulfillment Timestamps
  // ============================================
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

  // ============================================
  // Delivery Information
  // ============================================
  @ForeignKey(() => DeliveryRate)
  @Column({
    type: DataType.INTEGER,
    allowNull: true, // Null if PICKUP or INSTORE
  })
  deliveryRateId: number;

  @Column({
    type: DataType.STRING,
    allowNull: true, // Snapshotted from DeliveryLocation.name
  })
  deliveryLocation: string;

  @Column({
    type: DataType.STRING,
    allowNull: true, // Snapshotted from DeliveryRate.transportMode
  })
  deliveryMode: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  shippingAddress: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  deliveryNotes: string;

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
    type: DataType.DATE,
    allowNull: true,
  })
  expectedDeliveryDate: Date;

  // ============================================
  // Payment Information
  // ============================================
  @Column({
    type: DataType.ENUM(...Object.values(PaymentStatus)),
    allowNull: false,
    defaultValue: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethod)),
    allowNull: true,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  paidAt: Date;

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

  // ============================================
  // User References
  // ============================================
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  affiliateId: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  servedBy: number;

  // ============================================
  // Additional Information
  // ============================================
  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  feedbackToken: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  internalNotes: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  referrerSource: string;

  // ============================================
  // Relationships
  // ============================================
  @BelongsTo(() => Customer)
  customer: Customer;

  @BelongsTo(() => User, 'servedBy')
  servedByUser: User;

  @BelongsTo(() => DeliveryRate)
  deliveryRate: DeliveryRate;

  @HasMany(() => OrderItem)
  orderItems: OrderItem[];

  @HasMany(() => OrderDiscount)
  orderDiscounts: OrderDiscount[];

  @HasMany(() => Transaction)
  transactions: Transaction[];

  @HasMany(() => AffiliateCommission)
  affiliateCommissions: AffiliateCommission[];
}
