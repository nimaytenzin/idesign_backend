import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateWorkExperienceDto {
  @IsString()
  @IsNotEmpty()
  positionTitle: string;

  @IsDateString()
  @IsNotEmpty()
  effectiveDate: string;

  @IsString()
  @IsNotEmpty()
  agency: string;

  @IsString()
  @IsNotEmpty()
  place: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

