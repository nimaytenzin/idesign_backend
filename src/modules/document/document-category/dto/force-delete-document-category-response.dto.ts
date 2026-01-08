export class ForceDeleteDocumentCategoryResponseDto {
  success: boolean;
  message: string;
  categoryId?: number;
  categoryName?: string;
  deletedSubCategoriesCount?: number;
  deletedDocumentsCount?: number;

  [key: string]: any;
}
