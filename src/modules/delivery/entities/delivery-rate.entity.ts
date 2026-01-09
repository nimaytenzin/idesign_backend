import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { DeliveryMethod, DeliveryLocation } from './delivery.enums';

@Table({
  indexes: [
    {
      unique: true,
      fields: ['location', 'deliveryMethod'],
      name: 'unique_location_method',
    },
  ],
})
export class DeliveryRate extends Model<DeliveryRate> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({
    type: DataType.ENUM(...Object.values(DeliveryLocation)),
    allowNull: false,
  })
  location: DeliveryLocation;

  @Column({
    type: DataType.ENUM(...Object.values(DeliveryMethod)),
    allowNull: false,
  })
  deliveryMethod: DeliveryMethod;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  rate: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  createdAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  updatedAt: Date;
}

