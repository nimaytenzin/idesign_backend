import { IsOptional, IsString, IsNumber } from 'class-validator';

export class TrackVisitorDto {
  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsString()
  @IsOptional()
  referrer?: string;

  @IsNumber()
  @IsOptional()
  orderId?: number;
}

