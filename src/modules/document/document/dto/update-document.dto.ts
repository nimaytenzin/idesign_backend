import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDocumentDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  subCategoryId?: number;

  @IsOptional()
  @IsString()
  documentTitle?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fileSize?: number;

  @IsOptional()
  @IsString()
  fileType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  versionNumber?: number;
}
