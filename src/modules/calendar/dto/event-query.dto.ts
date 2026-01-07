import { IsDateString, IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';

export enum CalendarViewType {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  LIST = 'list',
}

export class EventQueryDto {
  @IsEnum(CalendarViewType)
  @IsOptional()
  view?: CalendarViewType;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  eventTypeId?: number;

  @IsNumber()
  @IsOptional()
  eventCategoryId?: number;
}

