import { IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAttendanceDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  long: number;
}
