export class DeleteDocumentCategoryResponseDto {
  success: boolean;
  message: string;
  categoryId?: number;
  categoryName?: string;

  [key: string]: any;
}
