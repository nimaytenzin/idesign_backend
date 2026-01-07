import { IsOptional, IsString } from 'class-validator';

export class MarkDeliveredDto {
  @IsString()
  @IsOptional()
  internalNotes?: string;
}

