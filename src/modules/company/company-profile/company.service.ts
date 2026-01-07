import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(Company)
    private companyModel: typeof Company,
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    // Check if company already exists (singleton pattern)
    const existingCompany = await this.companyModel.findOne();
    if (existingCompany) {
      throw new Error('Company details already exist. Use update endpoint instead.');
    }

    return this.companyModel.create({
      ...createCompanyDto,
      isActive: createCompanyDto.isActive ?? true,
    });
  }

  async findOne(): Promise<Company> {
    const company = await this.companyModel.findOne({
      where: { isActive: true },
    });

    if (!company) {
      throw new NotFoundException('Company details not found');
    }

    return company;
  }

  async findAll(): Promise<Company[]> {
    return this.companyModel.findAll({
      order: [['createdAt', 'DESC']],
    });
  }

  async update(updateCompanyDto: UpdateCompanyDto): Promise<Company> {
    const company = await this.companyModel.findOne();
    
    if (!company) {
      throw new NotFoundException('Company details not found');
    }

    await company.update(updateCompanyDto);
    return company.reload();
  }

  async remove(): Promise<void> {
    const company = await this.companyModel.findOne();
    
    if (!company) {
      throw new NotFoundException('Company details not found');
    }

    await company.destroy();
  }
}

