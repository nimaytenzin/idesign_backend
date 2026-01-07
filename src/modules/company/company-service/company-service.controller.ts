import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CompanyServiceService } from './company-service.service';
import { CreateCompanyServiceDto } from './dto/create-company-service.dto';
import { UpdateCompanyServiceDto } from './dto/update-company-service.dto';
import { CompanyService } from './entities/company-service.entity';

// Multer configuration for company service image uploads
const serviceImageStorage = diskStorage({
  destination: './uploads/company-services',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    const filename = `service-image-${uniqueSuffix}${ext}`;
    callback(null, filename);
  },
});

@Controller('company-services')
export class CompanyServiceController {
  constructor(private readonly companyServiceService: CompanyServiceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: serviceImageStorage,
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
  ): Promise<CompanyService> {
    // Transform FormData values
    const createCompanyServiceDto: CreateCompanyServiceDto = {
      title: body.title,
      description: body.description,
      icon: body.icon,
      isActive: body.isActive !== undefined 
        ? (body.isActive === 'true' || body.isActive === true) 
        : undefined,
    };

    // If file is uploaded, set imageUri from the uploaded file
    if (file) {
      createCompanyServiceDto.imageUri = `/uploads/company-services/${file.filename}`;
    }

    return this.companyServiceService.create(createCompanyServiceDto);
  }

  @Get()
  async findAll(): Promise<CompanyService[]> {
    return this.companyServiceService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CompanyService> {
    return this.companyServiceService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: serviceImageStorage,
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
  ): Promise<CompanyService> {
    // Transform FormData values
    const updateCompanyServiceDto: UpdateCompanyServiceDto = {};

    if (body.title !== undefined) updateCompanyServiceDto.title = body.title;
    if (body.description !== undefined) updateCompanyServiceDto.description = body.description;
    if (body.icon !== undefined) updateCompanyServiceDto.icon = body.icon;
    if (body.isActive !== undefined) {
      updateCompanyServiceDto.isActive = body.isActive === 'true' || body.isActive === true;
    }

    // If file is uploaded, set imageUri from the uploaded file
    if (file) {
      updateCompanyServiceDto.imageUri = `/uploads/company-services/${file.filename}`;
    }

    return this.companyServiceService.update(id, updateCompanyServiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.companyServiceService.remove(id);
  }
}

