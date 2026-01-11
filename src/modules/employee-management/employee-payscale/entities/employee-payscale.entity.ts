import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  Default,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from '../../../auth/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Table
export class EmployeePayscale extends Model<EmployeePayscale> {
  @PrimaryKey
  @Default(() => uuidv4())
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: true,
  })
  userId: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  basicSalary: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  benefitsAllowance: number;

  @Default(0.0)
  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.0,
  })
  salaryArrear: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  grossSalary: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  pfDeduction: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  gisDeduction: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  netSalary: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  tds: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  healthContribution: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  totalPayout: number;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  updatedAt: Date;

  @BelongsTo(() => User)
  user: User;
}
