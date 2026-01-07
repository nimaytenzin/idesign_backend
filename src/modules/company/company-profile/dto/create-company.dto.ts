import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsUrl,
  IsEnum,
} from 'class-validator';
import { ZpssBankName } from '../entities/company.entity';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  phone1?: string;

  @IsString()
  @IsOptional()
  phone2?: string;

  @IsString()
  @IsOptional()
  phone3?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  dzongkhag?: string;

  @IsString()
  @IsOptional()
  thromde?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  tpnNumber?: string;

  @IsString()
  @IsOptional()
  businessLicenseNumber?: string;

  @IsString()
  @IsOptional()
  slogan?: string;

  @IsUrl()
  @IsOptional()
  facebookLink?: string;

  @IsUrl()
  @IsOptional()
  tiktokLink?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsEnum(ZpssBankName)
  @IsOptional()
  zpssBankName?: ZpssBankName;

  @IsString()
  @IsOptional()
  zpssAccountName?: string;

  @IsString()
  @IsOptional()
  zpssAccountNumber?: string;
}

