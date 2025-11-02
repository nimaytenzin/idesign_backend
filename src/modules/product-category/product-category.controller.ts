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
import { ProductCategoryService } from './product-category.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategory } from './entities/product-category.entity';

@Controller('product-categories')
export class ProductCategoryController {
  constructor(
    private readonly productCategoryService: ProductCategoryService,
  ) {}

  @Post()
  create(
    @Body() createProductCategoryDto: CreateProductCategoryDto,
  ): Promise<ProductCategory> {
    return this.productCategoryService.create(createProductCategoryDto);
  }

  @Get()
  findAll(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<ProductCategory[]> {
    if (includeInactive === 'true') {
      return this.productCategoryService.findAllIncludingInactive();
    }
    return this.productCategoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ProductCategory> {
    return this.productCategoryService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductCategoryDto: UpdateProductCategoryDto,
  ): Promise<ProductCategory> {
    return this.productCategoryService.update(+id, updateProductCategoryDto);
  }

  @Patch(':id/toggle-status')
  toggleStatus(@Param('id') id: string): Promise<ProductCategory> {
    return this.productCategoryService.toggleStatus(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.productCategoryService.remove(+id);
  }
}
