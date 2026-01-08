import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './entities/company.entity';
import { join } from 'path';
import { existsSync } from 'fs';

// Multer configuration for company logo uploads
const companyLogoStorage = diskStorage({
  destination: './uploads/company-logos',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    const filename = `company-logo-${uniqueSuffix}${ext}`;
    callback(null, filename);
  },
});

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post('logo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: companyLogoStorage,
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadLogo(@UploadedFile() file?: any): Promise<Company> {
    console.log('file', file);
    console.log('uploading logo');
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const logoPath = `/uploads/company-logos/${file.filename}`;
    return this.companyService.updateLogo(logoPath);
  }

  @Get('logo')
  async getLogo(@Res() res: Response): Promise<void> {
    const company = await this.companyService.findOne();
    
    if (!company || !company.logo) {
      throw new BadRequestException('Company logo not found');
    }

    // If logo is already a full URL, redirect to it
    if (company.logo.startsWith('http://') || company.logo.startsWith('https://')) {
      return res.redirect(company.logo);
    }

    // If logo is a local path, serve the file
    const logoPath = join(process.cwd(), company.logo);
    
    if (!existsSync(logoPath)) {
      throw new BadRequestException('Logo file not found on server');
    }

    return res.sendFile(logoPath);
  }

  @Get('all')
  async findAll(): Promise<Company[]> {
    return this.companyService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCompanyDto: CreateCompanyDto): Promise<Company> {
    console.log('createCompanyDto', createCompanyDto);
    return this.companyService.create(createCompanyDto);
  }

  @Get()
  async findOne(): Promise<Company> {
    return this.companyService.findOne();
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  async update(@Body() updateCompanyDto: UpdateCompanyDto): Promise<Company> {
    return this.companyService.update(updateCompanyDto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(): Promise<void> {
    return this.companyService.remove();
  }
}

