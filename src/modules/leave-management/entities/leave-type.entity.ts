import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Default,
  HasMany,
} from 'sequelize-typescript';
import { LeaveRequest } from './leave-request.entity';
import { LeaveBalance } from './leave-balance.entity';

@Table
export class LeaveType extends Model<LeaveType> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  code: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  daysPerYear: number;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  canCarryForward: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  maxCarryForwardDays: number;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @HasMany(() => LeaveRequest)
  leaveRequests: LeaveRequest[];

  @HasMany(() => LeaveBalance)
  leaveBalances: LeaveBalance[];
}

