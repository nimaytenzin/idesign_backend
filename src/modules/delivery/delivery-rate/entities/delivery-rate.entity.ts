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
import { TransportMode } from './delivery.enums';
import { DeliveryLocation } from '../../delivery-location/entities/delivery-location.entity';

@Table({
  indexes: [
    {
      unique: true,
      fields: ['deliveryLocationId', 'transportMode'],
      name: 'unique_location_method',
    },
  ],
})
export class DeliveryRate extends Model<DeliveryRate> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => DeliveryLocation)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  deliveryLocationId: number;

  @Column({
    type: DataType.ENUM(...Object.values(TransportMode)),
    allowNull: false,
  })
  transportMode: TransportMode;

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

  @BelongsTo(() => DeliveryLocation)
  deliveryLocation: DeliveryLocation;
}
