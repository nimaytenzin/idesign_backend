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
} from 'sequelize-typescript';
import { User } from '../../auth/entities/user.entity';
import { LeaveType } from './leave-type.entity';

export enum LeaveRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Table({
  timestamps: true,
})
export class LeaveRequest extends Model<LeaveRequest> {
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
    type: DataType.DATE,
    allowNull: false,
  })
  startDate: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  endDate: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  numberOfDays: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  reason: string;

  @Default(LeaveRequestStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(LeaveRequestStatus)),
    allowNull: false,
    defaultValue: LeaveRequestStatus.PENDING,
  })
  status: LeaveRequestStatus;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  approvedBy: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  approvedAt: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  rejectionReason: string;

  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  appliedAt: Date;

  @BelongsTo(() => User, 'userId')
  user: User;

  @BelongsTo(() => User, 'approvedBy')
  approver: User;

  @BelongsTo(() => LeaveType)
  leaveType: LeaveType;
}

