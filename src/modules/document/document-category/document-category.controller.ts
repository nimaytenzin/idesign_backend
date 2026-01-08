import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { DocumentCategoryService } from './document-category.service';
import { DocumentCategory } from './entities/document-category.entity';
import { CreateDocumentCategoryDto } from './dto/create-document-category.dto';
import { UpdateDocumentCategoryDto } from './dto/update-document-category.dto';
import { DeleteDocumentCategoryResponseDto } from './dto/delete-document-category-response.dto';
import { ForceDeleteDocumentCategoryResponseDto } from './dto/force-delete-document-category-response.dto';

@Controller('document-categories')
export class DocumentCategoryController {
  constructor(
    private readonly documentCategoryService: DocumentCategoryService,
  ) {}

  @Post()
  create(
    @Body() createDocumentCategoryDto: CreateDocumentCategoryDto,
  ): Promise<DocumentCategory> {
    return this.documentCategoryService.create(createDocumentCategoryDto);
  }

  @Get()
  findAll(): Promise<DocumentCategory[]> {
    return this.documentCategoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<DocumentCategory> {
    return this.documentCategoryService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDocumentCategoryDto: UpdateDocumentCategoryDto,
  ): Promise<DocumentCategory> {
    return this.documentCategoryService.update(id, updateDocumentCategoryDto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteDocumentCategoryResponseDto> {
    return this.documentCategoryService.remove(id);
  }

  @Delete(':id/force')
  forceDelete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ForceDeleteDocumentCategoryResponseDto> {
    return this.documentCategoryService.forceDelete(id);
  }
}
