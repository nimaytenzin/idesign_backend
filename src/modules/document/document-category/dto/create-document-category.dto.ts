import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateDocumentCategoryDto {
  @IsNotEmpty()
  @IsString()
  categoryName: string;

  @IsOptional()
  @IsString()
  description?: string;
}
