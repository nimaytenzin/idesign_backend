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

@Table
export class EmployeeWorkExperience extends Model<EmployeeWorkExperience> {
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

  @BelongsTo(() => EmployeeProfile)
  employeeProfile: EmployeeProfile;
}
