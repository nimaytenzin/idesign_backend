import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DocumentSubCategoryService } from './document-sub-category.service';
import { DocumentSubCategoryController } from './document-sub-category.controller';
import { DocumentSubCategory } from './entities/document-sub-category.entity';

@Module({
  imports: [SequelizeModule.forFeature([DocumentSubCategory])],
  controllers: [DocumentSubCategoryController],
  providers: [DocumentSubCategoryService],
  exports: [DocumentSubCategoryService],
})
export class DocumentSubCategoryModule {}
