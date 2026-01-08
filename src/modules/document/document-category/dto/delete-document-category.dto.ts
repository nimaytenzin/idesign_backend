import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteDocumentCategoryDto {
  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  [key: string]: any;
}
