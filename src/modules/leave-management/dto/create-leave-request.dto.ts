import {
  IsInt,
  IsNotEmpty,
  IsDateString,
  IsString,
  Min,
} from 'class-validator';

export class CreateLeaveRequestDto {
  @IsInt()
  @IsNotEmpty()
  leaveTypeId: number;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

