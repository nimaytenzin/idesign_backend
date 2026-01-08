import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';

export class UpdateDocumentDto {
  @IsOptional()
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
  @IsNumber()
  @Min(0)
  fileSize?: number;

  @IsOptional()
  @IsString()
  fileType?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  versionNumber?: number;

  [key: string]: any;
}
