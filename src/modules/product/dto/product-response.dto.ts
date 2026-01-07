import { ProductImage } from '../entities/product-image.entity';
import { ProductSubCategory } from '../../product-sub-category/entities/product-sub-category.entity';
import { DiscountProductResponseDto } from './discount-product-response.dto';

export class ProductSubCategoryResponseDto {
  id: number;
  name: string;
  description: string | null;
  productCategory?: {
    id: number;
    name: string;
    description: string | null;
  };
}

export class ProductImageResponseDto {
  id: number;
  productId: number;
  imagePath: string;
  fileName: string;
  orientation: 'portrait' | 'landscape' | 'square';
  isPrimary: boolean;
  altText: string | null;
}

export class ProductResponseDto {
  id: number;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  dimensions: string;
  weight: number;
  price: number;
  material: string;
  isAvailable: boolean;
  isFeatured: boolean;
  productSubCategoryId: number;
  rating: number;
  salesCount: number;
  stockQuantity: number;
  createdAt: Date;
  updatedAt: Date;
  productSubCategory?: ProductSubCategoryResponseDto;
  images?: ProductImageResponseDto[];
  discountProducts?: DiscountProductResponseDto[];
}

