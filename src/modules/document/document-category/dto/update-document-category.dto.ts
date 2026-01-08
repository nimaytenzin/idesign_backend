import { IsString, IsOptional } from 'class-validator';

export class UpdateDocumentCategoryDto {
  @IsOptional()
  @IsString()
  categoryName?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
