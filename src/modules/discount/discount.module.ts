import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Discount } from './entities/discount.entity';
import { DiscountProduct } from './entities/discount-product.entity';
import { DiscountCategory } from './entities/discount-category.entity';
import { DiscountSubcategory } from './entities/discount-subcategory.entity';
import { Product } from '../product/entities/product.entity';
import { ProductSubCategory } from '../product-sub-category/entities/product-sub-category.entity';
import { DiscountService } from './services/discount.service';
import { DiscountCalculationService } from './services/discount-calculation.service';
import { DiscountController } from './discount.controller';
import { ProductModule } from '../product/product.module';
import { ProductSubCategoryModule } from '../product-sub-category/product-sub-category.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Discount,
      DiscountProduct,
      DiscountCategory,
      DiscountSubcategory,
      Product,
      ProductSubCategory,
    ]),
  ],
  controllers: [DiscountController],
  providers: [DiscountService, DiscountCalculationService],
  exports: [DiscountService, DiscountCalculationService],
})
export class DiscountModule {}

