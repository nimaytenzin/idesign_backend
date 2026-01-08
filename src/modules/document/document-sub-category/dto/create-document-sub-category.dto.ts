import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateDocumentSubCategoryDto {
  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @IsNotEmpty()
  @IsString()
  subCategoryName: string;

}
