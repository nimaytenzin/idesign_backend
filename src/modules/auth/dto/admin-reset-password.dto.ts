import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsNumber,
} from 'class-validator';

/**
 * DTO for admin to reset a user's password
 * Admin Only endpoint
 */
export class AdminResetPasswordDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}
