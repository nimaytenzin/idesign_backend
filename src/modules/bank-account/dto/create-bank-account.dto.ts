import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateBankAccountDto {
  @IsString()
  accountName: string;

  @IsString()
  bankName: string;

  @IsString()
  accountNumber: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  /**
   * If true, this account is used for RMA PG / online purchases. Only one account can have this true.
   */
  @IsBoolean()
  @IsOptional()
  useForRmaPg?: boolean;
}
