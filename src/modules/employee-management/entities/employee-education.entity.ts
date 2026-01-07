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
import { User } from '../../auth/entities/user.entity';

@Table({
  tableName: 'employee_education',
  timestamps: true,
})
export class EmployeeEducation extends Model<EmployeeEducation> {
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
    type: DataType.STRING,
    allowNull: false,
  })
  level: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  courseTitle: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  institute: string;

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
    allowNull: true,
  })
  durationDays: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  funding: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  status: string;

  @BelongsTo(() => User)
  user: User;
}

