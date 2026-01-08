import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProductCategoryService } from './product-category.service';
import { ProductCategoryController } from './product-category.controller';
import { ProductCategory } from './entities/product-category.entity';
import { ProductSubCategory } from '../product-sub-category/entities/product-sub-category.entity';
import { Product } from '../product/entities/product.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      ProductCategory,
      ProductSubCategory,
      Product,
    ]),
  ],
  controllers: [ProductCategoryController],
  providers: [ProductCategoryService],
  exports: [ProductCategoryService],
})
export class ProductCategoryModule {}
