import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ProductSubCategoryService } from './product-sub-category.service';
import { CreateProductSubCategoryDto } from './dto/create-product-sub-category.dto';
import { UpdateProductSubCategoryDto } from './dto/update-product-sub-category.dto';
import { ProductSubCategory } from './entities/product-sub-category.entity';

@Controller('product-sub-categories')
export class ProductSubCategoryController {
  constructor(
    private readonly productSubCategoryService: ProductSubCategoryService,
  ) {}

  @Post()
  create(
    @Body() createProductSubCategoryDto: CreateProductSubCategoryDto,
  ): Promise<ProductSubCategory> {
    return this.productSubCategoryService.create(createProductSubCategoryDto);
  }

  @Get()
  findAll(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<ProductSubCategory[]> {
    if (includeInactive === 'true') {
      return this.productSubCategoryService.findAllIncludingInactive();
    }
    return this.productSubCategoryService.findAll();
  }

  @Get('by-category/:categoryId')
  findByCategory(
    @Param('categoryId') categoryId: string,
  ): Promise<ProductSubCategory[]> {
    return this.productSubCategoryService.findByCategory(+categoryId);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ProductSubCategory> {
    return this.productSubCategoryService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductSubCategoryDto: UpdateProductSubCategoryDto,
  ): Promise<ProductSubCategory> {
    return this.productSubCategoryService.update(
      +id,
      updateProductSubCategoryDto,
    );
  }

  @Patch(':id/toggle-status')
  toggleStatus(@Param('id') id: string): Promise<ProductSubCategory> {
    return this.productSubCategoryService.toggleStatus(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.productSubCategoryService.remove(+id);
  }
}
