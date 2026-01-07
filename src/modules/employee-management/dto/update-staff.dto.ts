import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateStaffDto } from './create-staff.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateStaffDto extends PartialType(
  OmitType(CreateStaffDto, ['password'] as const),
) {
  @IsString()
  @IsOptional()
  employeeStatus?: 'ACTIVE' | 'INACTIVE' | 'TERMINATED';

  @IsOptional()
  terminationDate?: Date;
}

