import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsDateString,
    IsInt,
    Min,
    IsEnum,
    IsNumber,
  } from 'class-validator';
import { EmployeeEducationLevel, EmployeeEducationStatus } from 'src/constants/enums';

export class CreateEmployeeEducationDto {

  @IsNumber()
  @IsNotEmpty()
  employeeProfileId: number;

  @IsEnum(EmployeeEducationLevel)
  @IsNotEmpty()
  level: EmployeeEducationLevel;

  @IsString()
  @IsNotEmpty()
  courseTitle: string;

  @IsString()
  @IsNotEmpty()
  institute: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: Date;

  @IsDateString()
  @IsNotEmpty()
  endDate: Date;


  @IsEnum(EmployeeEducationStatus)
  @IsNotEmpty()
  status: EmployeeEducationStatus;
}
