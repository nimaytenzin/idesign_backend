import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  HasMany,
} from 'sequelize-typescript';
import { Order } from '../../order/entities/order.entity';

@Table
export class Customer extends Model<Customer> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  phoneNumber: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  shippingAddress: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  billingAddress: string;

  @HasMany(() => Order)
  orders: Order[];
}

