import {
  IsString,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsOptional,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  eventTypeId: number;

  @IsNumber()
  @IsOptional()
  eventCategoryId?: number;

  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;
}

