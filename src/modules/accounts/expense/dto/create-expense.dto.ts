import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  Min,
} from 'class-validator';
import { PaymentMethod } from '../entities/expense.entity';

export class CreateExpenseDto {
  @IsDateString()
  @IsNotEmpty()
  expenseDate: string;

  @IsString()
  @IsNotEmpty()
  accountCode: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  vendor?: string;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  receiptNumber?: string;

  @IsString()
  @IsOptional()
  receiptAttachment?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsBoolean()
  @IsOptional()
  autoPost?: boolean;

  @IsString()
  @IsOptional()
  cashAccountCode?: string;
}

