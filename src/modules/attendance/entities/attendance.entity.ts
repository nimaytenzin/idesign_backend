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
  Unique,
  Index,
} from 'sequelize-typescript';
import { User } from 'src/modules/auth/entities/user.entity';

@Table({
  indexes: [
    {
      unique: true,
      fields: ['userId', 'date'],
      name: 'unique_user_date',
    },
    {
      fields: ['userId'],
    },
    {
      fields: ['date'],
    },
  ],
})
export class Attendance extends Model<Attendance> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  date: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  attendanceTime: Date;

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
  })
  userLat: number;

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
  })
  userLong: number;

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
  })
  distanceFromOffice: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => User)
  user: User;
}
