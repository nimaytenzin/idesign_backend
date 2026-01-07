import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  Default,
  Unique,
} from 'sequelize-typescript';
import { User } from '../../auth/entities/user.entity';
import { LeaveType } from './leave-type.entity';

@Table({
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'leaveTypeId', 'year'],
    },
  ],
})
export class LeaveBalance extends Model<LeaveBalance> {
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

  @ForeignKey(() => LeaveType)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  leaveTypeId: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  year: number;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  allocatedDays: number;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  usedDays: number;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  carriedForwardDays: number;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => LeaveType)
  leaveType: LeaveType;

  // Virtual field for available days (calculated)
  get availableDays(): number {
    return this.allocatedDays + this.carriedForwardDays - this.usedDays;
  }
}

