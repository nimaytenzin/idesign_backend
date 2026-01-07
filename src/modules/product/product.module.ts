import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductSubCategory } from '../product-sub-category/entities/product-sub-category.entity';
import { ProductCategory } from '../product-category/entities/product-category.entity';
import { DiscountProduct } from '../discount/entities/discount-product.entity';
import { Discount } from '../discount/entities/discount.entity';
import { DiscountCategory } from '../discount/entities/discount-category.entity';
import { DiscountSubcategory } from '../discount/entities/discount-subcategory.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Product,
      ProductImage,
      ProductSubCategory,
      ProductCategory,
      DiscountProduct,
      Discount,
      DiscountCategory,
      DiscountSubcategory,
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
