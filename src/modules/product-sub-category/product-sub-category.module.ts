import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProductSubCategoryService } from './product-sub-category.service';
import { ProductSubCategoryController } from './product-sub-category.controller';
import { ProductSubCategory } from './entities/product-sub-category.entity';
import { ProductCategory } from '../product-category/entities/product-category.entity';
import { Product } from '../product/entities/product.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      ProductSubCategory,
      ProductCategory,
      Product,
    ]),
  ],
  controllers: [ProductSubCategoryController],
  providers: [ProductSubCategoryService],
  exports: [ProductSubCategoryService],
})
export class ProductSubCategoryModule {}
