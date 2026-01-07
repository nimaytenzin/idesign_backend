import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { UserRole } from 'src/modules/auth/entities/user.entity';

export class CreateAffiliateMarketerDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  cid: string;

  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsString()
  voucherCode: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercentage: number;
}

