import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsArray,
  IsInt,
  IsNumber,
} from 'class-validator';
import { SurveyStatus } from '../entities/survey.entity';

export class CreateSurveyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsNumber()
  @IsNotEmpty()
  year: number;

  @IsEnum(SurveyStatus)
  @IsOptional()
  status?: SurveyStatus;

  @IsBoolean()
  @IsOptional()
  isSubmitted?: boolean;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  enumerationAreaIds?: number[];
}
