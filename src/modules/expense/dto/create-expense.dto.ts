import {
  IsNumber,
  IsString,
  IsDateString,
  IsOptional,
  Min,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for recording (creating) an expense.
 * amount, description, and date are required; type, subtype, and notes are optional.
 */
export class CreateExpenseDto {
  /** Expense amount. Must be >= 0. Up to 2 decimal places (matches DECIMAL(10,2)). */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'amount must be greater than or equal to 0' })
  @Type(() => Number)
  amount: number;

  /** Short description of the expense (e.g. "Office supplies", "Electricity bill"). */
  @IsString()
  @IsNotEmpty({ message: 'description must not be empty' })
  @MaxLength(255)
  description: string;

  /** Date of the expense (ISO 8601 date, e.g. YYYY-MM-DD). */
  @IsDateString()
  date: string;

  /** Optional expense type (e.g. "Operating", "Marketing", "Personnel"). */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  type?: string;

  /** Optional expense subtype under type (e.g. "Rent", "Ads", "Salaries"). */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtype?: string;

  /** Optional notes or reference (e.g. invoice number, vendor). */
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
