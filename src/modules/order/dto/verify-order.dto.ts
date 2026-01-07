import {
  IsOptional,
  IsString,
} from 'class-validator';

export class VerifyOrderDto {
  @IsString()
  @IsOptional()
  internalNotes?: string;
}

