import {
  IsString,
  IsEmail,
  IsOptional,
  ValidateIf,
} from 'class-validator';

export class CustomerDetailsDto {
  @IsString()
  @IsOptional()
  name?: string;

  @ValidateIf((o) => !o.name || o.email)
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @IsString()
  @IsOptional()
  billingAddress?: string;
}

