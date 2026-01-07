import { IsOptional, IsInt } from 'class-validator';

export class LeaveBalanceQueryDto {
  @IsInt()
  @IsOptional()
  userId?: number;

  @IsInt()
  @IsOptional()
  leaveTypeId?: number;

  @IsInt()
  @IsOptional()
  year?: number;
}

