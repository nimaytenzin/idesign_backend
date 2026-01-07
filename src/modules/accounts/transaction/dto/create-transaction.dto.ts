import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  accountCode: string;

  @IsNumber()
  @IsOptional()
  orderId?: number;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  debitAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  creditAmount?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  referenceNumber?: string;
}

