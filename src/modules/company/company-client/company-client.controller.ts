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
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CompanyClientService } from './company-client.service';
import { CreateCompanyClientDto } from './dto/create-company-client.dto';
import { UpdateCompanyClientDto } from './dto/update-company-client.dto';
import { CompanyClient } from './entities/company-client.entity';

// Multer configuration for company client logo uploads
const clientLogoStorage = diskStorage({
  destination: './uploads/company-clients',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    const filename = `client-logo-${uniqueSuffix}${ext}`;
    callback(null, filename);
  },
});

@Controller('company-clients')
export class CompanyClientController {
  constructor(private readonly companyClientService: CompanyClientService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: clientLogoStorage,
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
  ): Promise<CompanyClient> {
    // Transform FormData values
    const createCompanyClientDto: CreateCompanyClientDto = {
      name: body.name,
      websiteUrl: body.websiteUrl,
      socialMediaUrl: body.socialMediaUrl,
      isActive: body.isActive === 'true' || body.isActive === true,
    };

    // If file is uploaded, set logo from the uploaded file
    if (file) {
      createCompanyClientDto.logo = `/uploads/company-clients/${file.filename}`;
    }

    return this.companyClientService.create(createCompanyClientDto);
  }

  @Get()
  async findAll(): Promise<CompanyClient[]> {
    return this.companyClientService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CompanyClient> {
    return this.companyClientService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: clientLogoStorage,
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
  ): Promise<CompanyClient> {
    // Transform FormData values
    const updateCompanyClientDto: UpdateCompanyClientDto = {};

    if (body.name !== undefined) updateCompanyClientDto.name = body.name;
    if (body.websiteUrl !== undefined) updateCompanyClientDto.websiteUrl = body.websiteUrl;
    if (body.socialMediaUrl !== undefined) updateCompanyClientDto.socialMediaUrl = body.socialMediaUrl;
    if (body.isActive !== undefined) {
      updateCompanyClientDto.isActive = body.isActive === 'true' || body.isActive === true;
    }

    // If file is uploaded, set logo from the uploaded file
    if (file) {
      updateCompanyClientDto.logo = `/uploads/company-clients/${file.filename}`;
    }

    return this.companyClientService.update(id, updateCompanyClientDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.companyClientService.remove(id);
  }
}

