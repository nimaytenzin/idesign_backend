import { IsString, IsNotEmpty, IsDateString, IsNumber } from 'class-validator';

export class CreateEmployeeWorkExperienceDto {
  @IsNumber()
  @IsNotEmpty()
  employeeProfileId: number;

  @IsString()
  @IsNotEmpty()
  positionTitle: string;

  @IsDateString()
  @IsNotEmpty()
  effectiveDate: Date;

  @IsString()
  @IsNotEmpty()
  agency: string;

  @IsString()
  @IsNotEmpty()
  place: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: Date;
}
