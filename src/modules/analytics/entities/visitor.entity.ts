import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  Index,
} from 'sequelize-typescript';
import { Order } from '../../order/entities/order.entity';

export enum DeviceType {
  MOBILE = 'MOBILE',
  TABLET = 'TABLET',
  COMPUTER = 'COMPUTER',
  UNKNOWN = 'UNKNOWN',
}

export enum ReferrerSource {
  SEARCH_ENGINE = 'SEARCH_ENGINE',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  DIRECT = 'DIRECT',
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN',
}

@Table
export class Visitor extends Model<Visitor> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Index
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  sessionId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  ipAddress: string;

  @Index
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  country: string;

  @Index
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  district: string;

  @Index
  @Column({
    type: DataType.ENUM(...Object.values(DeviceType)),
    allowNull: false,
    defaultValue: DeviceType.UNKNOWN,
  })
  deviceType: DeviceType;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  referrer: string;

  @Index
  @Column({
    type: DataType.ENUM(...Object.values(ReferrerSource)),
    allowNull: false,
    defaultValue: ReferrerSource.UNKNOWN,
  })
  referrerSource: ReferrerSource;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  userAgent: string;

  @Index
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  visitedAt: Date;

  @Index
  @ForeignKey(() => Order)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  orderId: number;

  @BelongsTo(() => Order)
  order: Order;
}

