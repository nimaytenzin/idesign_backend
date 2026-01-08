import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';

// Multer configuration for file uploads
const storage = diskStorage({
  destination: './uploads/images',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    const filename = `product-${uniqueSuffix}${ext}`;
    callback(null, filename);
  },
});

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productService.create(createProductDto);
  }

  // ProductImage endpoints - Must come before generic :id routes
  @Post(':id/images')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage,
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async addImages(
    @Param('id') id: string,
    @UploadedFiles() files: any[],
    @Body()
    body: {
      orientations?: string[];
      altTexts?: string[];
      isPrimary?: boolean[];
    },
  ): Promise<ProductImage[]> {
    const productId = +id;
    const images: ProductImage[] = [];

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imagePath = `/uploads/images/${file.filename}`;

        // Parse orientations and altTexts from body if provided
        const orientations = body.orientations
          ? JSON.parse(body.orientations.toString())
          : [];
        const altTexts = body.altTexts
          ? JSON.parse(body.altTexts.toString())
          : [];
        const isPrimaryArray = body.isPrimary
          ? JSON.parse(body.isPrimary.toString())
          : [];

        const createImageDto: CreateProductImageDto = {
          productId,
          imagePath,
          fileName: file.filename,
          orientation: orientations[i] || 'square',
          altText: altTexts[i] || '',
          isPrimary: isPrimaryArray[i] || i === 0, // First image is primary by default
        };

        const image = await this.productService.addImage(createImageDto);
        images.push(image);
      }
    }

    return images;
  }

  @Get(':id/images')
  getProductImages(@Param('id') id: string): Promise<ProductImage[]> {
    return this.productService.getProductImages(+id);
  }

  @Patch(':productId/images/:imageId')
  updateImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
    @Body() updateImageDto: UpdateProductImageDto,
  ): Promise<ProductImage> {
    return this.productService.updateImage(+imageId, updateImageDto);
  }

  @Delete(':productId/images/:imageId')
  removeImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ): Promise<void> {
    return this.productService.removeImage(+imageId);
  }

  @Patch(':productId/images/:imageId/primary')
  setPrimaryImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ): Promise<ProductImage> {
    return this.productService.setPrimaryImage(+productId, +imageId);
  }

  // Specific routes before generic routes
  @Get('admin')
  findAllAdmin(): Promise<Product[]> {
    return this.productService.findAll();
  }

  @Get('featured')
  findAllFeatured(): Promise<Product[]> {
    return this.productService.findAllFeatured();
  }

  @Get()
  findAll(@Query() query: ProductQueryDto): Promise<Product[]> {
    return this.productService.findAllWithQuery(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Product> {
    return this.productService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return this.productService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.productService.remove(+id);
  }

  @Patch(':id/sales')
  incrementSales(@Param('id') id: string): Promise<Product> {
    return this.productService.incrementSales(+id);
  }

  @Patch(':id/rating')
  updateRating(
    @Param('id') id: string,
    @Body() body: { rating: number },
  ): Promise<Product> {
    return this.productService.updateRating(+id, body.rating);
  }
}
