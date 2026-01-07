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
  tableName: 'employee_work_experience',
  timestamps: true,
})
export class EmployeeWorkExperience extends Model<EmployeeWorkExperience> {
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
  positionTitle: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  effectiveDate: Date;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  agency: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  place: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  endDate: Date;

  @BelongsTo(() => User)
  user: User;
}

