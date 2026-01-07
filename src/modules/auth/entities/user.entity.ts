import { Column, DataType, Model, Table, HasMany, Default } from 'sequelize-typescript';
import { EmployeeEducation } from '../../employee-management/entities/employee-education.entity';
import { EmployeeWorkExperience } from '../../employee-management/entities/employee-work-experience.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  AFFILIATE_MARKETER = 'AFFILIATE_MARKETER',
}

@Table
export class User extends Model {
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
    allowNull: false,
  })
  password: string;

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

  // Employee fields (only relevant when role is EMPLOYEE)
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  employeeId: string;

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
    type: DataType.ENUM('ACTIVE', 'INACTIVE', 'TERMINATED'),
    allowNull: true,
  })
  employeeStatus: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  address: string;

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

  // Affiliate marketer fields (only relevant when role is AFFILIATE_MARKETER)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  voucherCode: string;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
  })
  discountPercentage: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
  })
  commissionPercentage: number;

  @HasMany(() => EmployeeEducation)
  educations: EmployeeEducation[];

  @HasMany(() => EmployeeWorkExperience)
  workExperiences: EmployeeWorkExperience[];
}
