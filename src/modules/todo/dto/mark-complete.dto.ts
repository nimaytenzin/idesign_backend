import { IsString, IsOptional } from 'class-validator';

export class MarkCompleteDto {
  @IsString()
  @IsOptional()
  remarks?: string;
}
