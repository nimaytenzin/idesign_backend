import { IsDateString, IsOptional } from 'class-validator';

export class CalendarEventQueryDto {
  @IsDateString()
  @IsOptional()
  start?: string;

  @IsDateString()
  @IsOptional()
  end?: string;
}
