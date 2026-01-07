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
} from 'sequelize-typescript';
import { Order } from './order.entity';
import { Discount } from '../../discount/entities/discount.entity';

/**
 * Tracks which discounts were applied to an order
 * This allows tracking multiple discounts per order and provides audit trail
 */
@Table
export class OrderDiscount extends Model<OrderDiscount> {
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

  @ForeignKey(() => Discount)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  discountId: number;

  /**
   * The discount amount applied from this specific discount
   * For ORDER_TOTAL scope: this is the order-level discount
   * For PER_PRODUCT scope: this is the sum of discounts applied to all products
   */
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  discountAmount: number;

  /**
   * Discount name at the time of application (for historical reference)
   */
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  discountName: string;

  /**
   * Discount type at the time of application
   */
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  discountType: string;

  /**
   * Voucher code used (if applicable)
   */
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  voucherCode: string | null;

  @CreatedAt
  appliedAt: Date;

  @BelongsTo(() => Order)
  order: Order;

  @BelongsTo(() => Discount)
  discount: Discount;
}

