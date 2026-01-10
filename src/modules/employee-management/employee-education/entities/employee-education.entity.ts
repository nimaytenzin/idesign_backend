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
import { EmployeeProfile } from '../../employee-profile/entities/employee-profile.entity';
import { EmployeeEducationLevel, EmployeeEducationStatus } from 'src/constants/enums';

@Table
export class EmployeeEducation extends Model<EmployeeEducation> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => EmployeeProfile)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  employeeProfileId: number;

  @Column({
    type: DataType.ENUM(...Object.values(EmployeeEducationLevel)),
    allowNull: false,
  })
  level: EmployeeEducationLevel;

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
    type: DataType.ENUM(...Object.values(EmployeeEducationStatus)),
    allowNull: false,
  })
  status: EmployeeEducationStatus;

  @BelongsTo(() => EmployeeProfile)
  employeeProfile: EmployeeProfile;
}
