import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateDocumentSubCategoryDto {
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsString()
  subCategoryName?: string;
}
