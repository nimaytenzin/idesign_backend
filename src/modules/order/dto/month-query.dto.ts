import { IsNotEmpty, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class MonthQueryDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1900)
  @Max(2100)
  year: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;
}
