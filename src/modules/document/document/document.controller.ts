import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { Document } from './entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import type { Multer } from 'multer';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile() file?: Multer.File,
  ): Promise<Document> {
    return this.documentService.create(createDocumentDto, file);
  }

  @Get()
  findAll(
    @Query('subCategoryId') subCategoryId?: number,
    @Query('userId') userId?: number,
  ): Promise<Document[]> {
    if (subCategoryId) {
      return this.documentService.findBySubCategory(subCategoryId);
    }
    if (userId) {
      return this.documentService.findByUser(userId);
    }
    return this.documentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Document> {
    return this.documentService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ): Promise<Document> {
    return this.documentService.update(id, updateDocumentDto);
  }

  @Patch(':id/increment-version')
  incrementVersion(@Param('id', ParseIntPipe) id: number): Promise<Document> {
    return this.documentService.incrementVersion(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.documentService.remove(id);
  }
}
