import { IsString, IsOptional, IsEnum } from 'class-validator';
import { LeaveRequestStatus } from '../entities/leave-request.entity';

export class UpdateLeaveRequestDto {
  @IsEnum(LeaveRequestStatus)
  @IsOptional()
  status?: LeaveRequestStatus;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

