import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { LocationType } from './delivery.enums';

@Table
export class DeliveryLocation extends Model<DeliveryLocation> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  name: string;

  @Column({
    type: DataType.ENUM(...Object.values(LocationType)),
    allowNull: false,
  })
  type: LocationType;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
