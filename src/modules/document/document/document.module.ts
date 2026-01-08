import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { Document } from './entities/document.entity';

@Module({
  imports: [SequelizeModule.forFeature([Document])],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
