import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './entities/company.entity';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCompanyDto: CreateCompanyDto): Promise<Company> {
    return this.companyService.create(createCompanyDto);
  }

  @Get()
  async findOne(): Promise<Company> {
    return this.companyService.findOne();
  }

  @Get('all')
  async findAll(): Promise<Company[]> {
    return this.companyService.findAll();
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

