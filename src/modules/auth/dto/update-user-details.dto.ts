import {
  IsEmail,
  IsString,
  IsOptional,
} from 'class-validator';

/**
 * DTO for updating user details (name, email, phone, etc.)
 * Cannot update: role, isActive, password (use separate endpoints)
 * Available for: Admin, Staff, Affiliate Marketer
 */
export class UpdateUserDetailsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  emailAddress?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  currentAddress?: string;

  @IsOptional()
  @IsString()
  permanentAddress?: string;

  @IsOptional()
  dateOfBirth?: Date;

  @IsOptional()
  @IsString()
  profileImageUrl?: string;
}
