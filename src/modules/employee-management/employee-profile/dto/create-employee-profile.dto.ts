import { IsString, IsNotEmpty, IsDateString, IsOptional, IsEnum, IsNumber } from "class-validator";
import { EmployeeStatus } from "src/constants/enums";

export class CreateEmployeeProfileDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  department: string;

  @IsString()
  @IsNotEmpty()
  position: string;

  @IsDateString()
  @IsNotEmpty()
  hireDate: Date;
 

  @IsEnum(EmployeeStatus)
  @IsNotEmpty()
  employeeStatus: EmployeeStatus;
}
