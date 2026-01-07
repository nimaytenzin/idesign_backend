import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class TrackOrderDto {
  @IsString()
  @IsOptional()
  orderNumber?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;
}

