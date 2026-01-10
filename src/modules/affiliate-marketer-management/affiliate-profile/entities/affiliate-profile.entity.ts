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
import { User } from '../../../auth/entities/user.entity';

@Table
export class AffiliateProfile extends Model<AffiliateProfile> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: true,
  })
  userId: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  voucherCode: string;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
  })
  discountPercentage: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
  })
  commissionPercentage: number;

  @BelongsTo(() => User)
  user: User;
}
