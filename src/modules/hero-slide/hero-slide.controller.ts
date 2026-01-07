import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { HeroSlideService } from './hero-slide.service';
import { CreateHeroSlideDto } from './dto/create-hero-slide.dto';
import { UpdateHeroSlideDto } from './dto/update-hero-slide.dto';
import { HeroSlide } from './entities/hero-slide.entity';

// Multer configuration for hero slide image uploads
const heroSlideStorage = diskStorage({
  destination: './uploads/hero-slides',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    const filename = `hero-slide-${uniqueSuffix}${ext}`;
    callback(null, filename);
  },
});

@Controller('hero-slides')
export class HeroSlideController {
  constructor(private readonly heroSlideService: HeroSlideService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: heroSlideStorage,
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async create(
    @Body() body: any,
    @UploadedFile() file?: any,
  ): Promise<HeroSlide> {
    // Transform FormData values (all come as strings)
    const createHeroSlideDto: CreateHeroSlideDto = {
      title: body.title,
      description: body.description,
      ctaText: body.ctaText,
      ctaLink: body.ctaLink,
      isActive: body.isActive !== undefined 
        ? (body.isActive === 'true' || body.isActive === true) 
        : undefined,
      order: body.order !== undefined && body.order !== '' 
        ? parseInt(body.order, 10) 
        : undefined,
    };

    // If file is uploaded, set imageUri from the uploaded file
    if (file) {
      createHeroSlideDto.imageUri = `/uploads/hero-slides/${file.filename}`;
    }

    // Validate that imageUri is provided (either from file upload or in DTO)
    if (!createHeroSlideDto.imageUri) {
      throw new BadRequestException('Image is required. Please upload an image file.');
    }

    return this.heroSlideService.create(createHeroSlideDto);
  }

  @Get()
  async findAll(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<HeroSlide[]> {
    const includeInactiveBool = includeInactive === 'true';
    return this.heroSlideService.findAll(includeInactiveBool);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<HeroSlide> {
    return this.heroSlideService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: heroSlideStorage,
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @UploadedFile() file?: any,
  ): Promise<HeroSlide> {
    // Transform FormData values (all come as strings)
    const updateHeroSlideDto: UpdateHeroSlideDto = {};

    if (body.title !== undefined) updateHeroSlideDto.title = body.title;
    if (body.description !== undefined) updateHeroSlideDto.description = body.description;
    if (body.ctaText !== undefined) updateHeroSlideDto.ctaText = body.ctaText;
    if (body.ctaLink !== undefined) updateHeroSlideDto.ctaLink = body.ctaLink;
    if (body.isActive !== undefined) {
      updateHeroSlideDto.isActive = body.isActive === 'true' || body.isActive === true;
    }
    if (body.order !== undefined) {
      updateHeroSlideDto.order = parseInt(body.order, 10);
    }

    // If file is uploaded, set imageUri from the uploaded file
    if (file) {
      updateHeroSlideDto.imageUri = `/uploads/hero-slides/${file.filename}`;
    }

    return this.heroSlideService.update(id, updateHeroSlideDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.heroSlideService.remove(id);
  }

  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  async reorder(@Body() body: { slideIds: number[] }): Promise<HeroSlide[]> {
    return this.heroSlideService.reorder(body.slideIds);
  }
}

