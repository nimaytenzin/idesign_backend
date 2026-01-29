import { IsOptional, IsString } from 'class-validator';

export class MarkConfirmedDto {
  @IsString()
  @IsOptional()
  internalNotes?: string;
}
