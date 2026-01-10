import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Default,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { OrderSource } from '../../order/entities/order.enums';

export enum SmsTriggerEvent {
  ORDER_PLACED = 'ORDER_PLACED',
  PLACED_TO_CONFIRMED = 'PLACED_TO_CONFIRMED',
  CONFIRMED_TO_PROCESSING = 'CONFIRMED_TO_PROCESSING',
  PROCESSING_TO_SHIPPING = 'PROCESSING_TO_SHIPPING',
  SHIPPING_TO_DELIVERED = 'SHIPPING_TO_DELIVERED',
  ORDER_CANCELED = 'ORDER_CANCELED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  COUNTER_PAYMENT_RECEIPT = 'COUNTER_PAYMENT_RECEIPT',
}

@Table
export class SmsTemplate extends Model<SmsTemplate> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({
    type: DataType.ENUM(...Object.values(SmsTriggerEvent)),
    allowNull: false,
  })
  triggerEvent: SmsTriggerEvent;

  @Column({ type: DataType.TEXT, allowNull: false })
  message: string;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  isActive: boolean;

  @Default(1)
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  sendCount: number;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  sendDelay: number;

  @Column({
    type: DataType.ENUM(...Object.values(OrderSource)),
    allowNull: true,
  })
  orderSource: OrderSource | null;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  priority: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

