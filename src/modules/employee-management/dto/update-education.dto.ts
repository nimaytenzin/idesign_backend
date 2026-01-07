import { PartialType } from '@nestjs/mapped-types';
import { CreateEducationDto } from './create-education.dto';
import { IsDateString, IsOptional } from 'class-validator';

export class UpdateEducationDto extends PartialType(CreateEducationDto) {
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

