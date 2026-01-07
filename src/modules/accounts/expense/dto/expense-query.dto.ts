import {
  IsOptional,
  IsDateString,
  IsString,
  IsEnum,
} from 'class-validator';
import { PaymentMethod } from '../entities/expense.entity';

export class ExpenseQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  accountCode?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  isPosted?: boolean;
}

