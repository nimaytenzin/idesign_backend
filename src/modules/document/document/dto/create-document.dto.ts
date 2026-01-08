import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDocumentDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  subCategoryId: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsString()
  documentTitle: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  versionNumber?: number;
}
