import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateDocumentDto {
  @IsNotEmpty()
  @IsNumber()
  subCategoryId: number;

  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsString()
  documentTitle: string;

  @IsNotEmpty()
  @IsString()
  fileName: string;

  @IsNotEmpty()
  @IsString()
  fileUrl: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  fileSize: number;

  @IsNotEmpty()
  @IsString()
  fileType: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  versionNumber?: number;

  [key: string]: any;
}
