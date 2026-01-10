import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { User } from '../../../auth/entities/user.entity';
import { EmployeeEducation } from '../../employee-education/entities/employee-education.entity';
import { EmployeeWorkExperience } from '../../employee-work-experience/entities/employee-work-experience.entity';
import { EmployeeStatus } from 'src/constants/enums';

@Table
export class EmployeeProfile extends Model<EmployeeProfile> {
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
  })
  department: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  position: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  bio: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  hireDate: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  terminationDate: Date;


  @Column({
    type: DataType.ENUM(...Object.values(EmployeeStatus)),
    allowNull: true,
  })
  employeeStatus: EmployeeStatus;

  @BelongsTo(() => User)
  user: User;

  @HasMany(() => EmployeeEducation)
  educations: EmployeeEducation[];

  @HasMany(() => EmployeeWorkExperience)
  workExperiences: EmployeeWorkExperience[];
}


