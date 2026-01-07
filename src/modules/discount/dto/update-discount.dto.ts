import { PartialType } from '@nestjs/mapped-types';
import { CreateDiscountDto } from './create-discount.dto';
import {
  IsDateString,
  ValidateIf,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { DiscountType } from '../entities/discount.entity';

export class UpdateDiscountDto extends PartialType(CreateDiscountDto) {
  // Override to make dates optional in updates
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

