import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { AccountType, NormalBalance } from '../entities/chart-of-accounts.entity';

export class CreateChartOfAccountsDto {
  @IsString()
  @IsNotEmpty()
  accountCode: string;

  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsEnum(AccountType)
  @IsNotEmpty()
  accountType: AccountType;

  @IsEnum(NormalBalance)
  @IsNotEmpty()
  normalBalance: NormalBalance;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

