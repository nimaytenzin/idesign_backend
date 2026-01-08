import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DocumentCategoryService } from './document-category.service';
import { DocumentCategoryController } from './document-category.controller';
import { DocumentCategory } from './entities/document-category.entity';

@Module({
  imports: [SequelizeModule.forFeature([DocumentCategory])],
  controllers: [DocumentCategoryController],
  providers: [DocumentCategoryService],
  exports: [DocumentCategoryService],
})
export class DocumentCategoryModule {}
