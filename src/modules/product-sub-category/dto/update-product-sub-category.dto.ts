import { PartialType } from '@nestjs/mapped-types';
import { CreateProductSubCategoryDto } from './create-product-sub-category.dto';

export class UpdateProductSubCategoryDto extends PartialType(
  CreateProductSubCategoryDto,
) {}
