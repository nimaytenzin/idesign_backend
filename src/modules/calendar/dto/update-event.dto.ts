import {
  IsString,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @IsOptional()
  eventTypeId?: number;

  @IsNumber()
  @IsOptional()
  eventCategoryId?: number;

  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;
}

