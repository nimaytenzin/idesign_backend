import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from '../../auth/entities/user.entity';
import { Order } from '../../order/entities/order.entity';
import { PaymentStatus } from '../../order/entities/order.enums';

@Table({
  tableName: 'affiliate_commissions',
  timestamps: true,
})
export class AffiliateCommission extends Model<AffiliateCommission> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  affiliateId: number;

  @ForeignKey(() => Order)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  orderId: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  orderTotal: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  commissionAmount: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
  })
  commissionPercentage: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  orderDate: Date;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentStatus)),
    allowNull: false,
    defaultValue: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => User)
  affiliate: User;

  @BelongsTo(() => Order)
  order: Order;
}

