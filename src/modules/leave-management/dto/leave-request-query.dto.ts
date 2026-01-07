import { IsOptional, IsInt, IsEnum, IsString } from 'class-validator';
import { LeaveRequestStatus } from '../entities/leave-request.entity';

export class LeaveRequestQueryDto {
  @IsInt()
  @IsOptional()
  userId?: number;

  @IsInt()
  @IsOptional()
  leaveTypeId?: number;

  @IsEnum(LeaveRequestStatus)
  @IsOptional()
  status?: LeaveRequestStatus;

  @IsInt()
  @IsOptional()
  year?: number;

  @IsInt()
  @IsOptional()
  month?: number;
}

