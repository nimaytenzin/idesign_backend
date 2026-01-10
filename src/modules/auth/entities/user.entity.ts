import {
  Column,
  DataType,
  Model,
  Table,
  HasOne,
  Default,
} from 'sequelize-typescript';
import { EmployeeProfile } from '../../employee-management/employee-profile/entities/employee-profile.entity';
import { AffiliateProfile } from '../../affiliate-marketer-management/affiliate-profile/entities/affiliate-profile.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  AFFILIATE_MARKETER = 'AFFILIATE_MARKETER',
}

@Table
export class User extends Model<User> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
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
  cid: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  emailAddress: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  phoneNumber: string;


  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  tpnNumber: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  currentAddress: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  permanentAddress: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  dateOfBirth: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  profileImageUrl: string;



  //restrictive upate access for staff and affiliate marketer, only admin can update role and isActive
  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    allowNull: false,
    defaultValue: UserRole.STAFF,
  })
  role: UserRole;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive: boolean;



  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  resetPasswordToken: string;

  @HasOne(() => EmployeeProfile)
  employeeProfile: EmployeeProfile;

  @HasOne(() => AffiliateProfile)
  affiliateProfile: AffiliateProfile;
}
