import {
  IsString,
  IsNotEmpty,
  IsPhoneNumber,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateSmDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  senderName?: string;
}

export class SendSmsNotificationDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  senderName?: string;
}

export class SendSmsApiDto {
  @IsString()
  @IsNotEmpty()
  auth: string;

  @IsString()
  @IsNotEmpty()
  carrier: string;

  @IsNumber()
  @IsNotEmpty()
  contact: number;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  senderName: string;
}

export interface SmsResponseDto {
  message: string;
  status: string;
  success?: boolean;
}
