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
import { DocumentSubCategoryService } from './document-sub-category.service';
import { DocumentSubCategory } from './entities/document-sub-category.entity';
import { CreateDocumentSubCategoryDto } from './dto/create-document-sub-category.dto';
import { UpdateDocumentSubCategoryDto } from './dto/update-document-sub-category.dto';
import { ForceDeleteDocumentSubCategoryResponseDto } from './dto/force-delete-document-sub-category-response.dto';

@Controller('document-sub-categories')
export class DocumentSubCategoryController {
  constructor(
    private readonly documentSubCategoryService: DocumentSubCategoryService,
  ) {}

  @Post()
  create(
    @Body() createDocumentSubCategoryDto: CreateDocumentSubCategoryDto,
  ): Promise<DocumentSubCategory> {
    return this.documentSubCategoryService.create(
      createDocumentSubCategoryDto,
    );
  }

  @Get()
  findAll(): Promise<DocumentSubCategory[]> {
    return this.documentSubCategoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<DocumentSubCategory> {
    return this.documentSubCategoryService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDocumentSubCategoryDto: UpdateDocumentSubCategoryDto,
  ): Promise<DocumentSubCategory> {
    return this.documentSubCategoryService.update(
      id,
      updateDocumentSubCategoryDto,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.documentSubCategoryService.remove(id);
  }

  @Delete(':id/force')
  forceDelete(@Param('id', ParseIntPipe) id: number): Promise<ForceDeleteDocumentSubCategoryResponseDto> {
    return this.documentSubCategoryService.forceDelete(id);
  }
}
