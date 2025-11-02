import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProductSubCategoryService } from './product-sub-category.service';
import { ProductSubCategoryController } from './product-sub-category.controller';
import { ProductSubCategory } from './entities/product-sub-category.entity';
import { ProductCategory } from '../product-category/entities/product-category.entity';

@Module({
  imports: [SequelizeModule.forFeature([ProductSubCategory, ProductCategory])],
  controllers: [ProductSubCategoryController],
  providers: [ProductSubCategoryService],
  exports: [ProductSubCategoryService],
})
export class ProductSubCategoryModule {}
