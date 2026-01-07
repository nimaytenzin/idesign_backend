import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { CompanyClient } from './entities/company-client.entity';
import { CreateCompanyClientDto } from './dto/create-company-client.dto';
import { UpdateCompanyClientDto } from './dto/update-company-client.dto';

@Injectable()
export class CompanyClientService {
  constructor(
    @InjectModel(CompanyClient)
    private companyClientModel: typeof CompanyClient,
  ) {}

  async create(createCompanyClientDto: CreateCompanyClientDto): Promise<CompanyClient> {
    return this.companyClientModel.create({
      ...createCompanyClientDto,
      isActive: createCompanyClientDto.isActive ?? true,
    });
  }

  async findAll(): Promise<CompanyClient[]> {
    return this.companyClientModel.findAll({
      order: [['name', 'ASC']],
    });
  }

  async findOne(id: number): Promise<CompanyClient> {
    const client = await this.companyClientModel.findByPk(id);

    if (!client) {
      throw new NotFoundException(`Company client with ID ${id} not found`);
    }

    return client;
  }

  async update(
    id: number,
    updateCompanyClientDto: UpdateCompanyClientDto,
  ): Promise<CompanyClient> {
    const client = await this.findOne(id);

    // If a new logo is being uploaded, delete the old logo file
    if (updateCompanyClientDto.logo && client.logo !== updateCompanyClientDto.logo) {
      this.deleteLogoFile(client.logo);
    }

    await client.update(updateCompanyClientDto);

    return client.reload();
  }

  async remove(id: number): Promise<void> {
    const client = await this.findOne(id);

    // Delete the associated logo file
    if (client.logo) {
      this.deleteLogoFile(client.logo);
    }

    await client.destroy();
  }

  /**
   * Delete logo file from the filesystem
   */
  private deleteLogoFile(logoUri: string): void {
    try {
      // Extract filename from URI (e.g., /uploads/company-clients/filename.jpg)
      const filename = logoUri.replace('/uploads/company-clients/', '');
      const filePath = join(process.cwd(), 'uploads', 'company-clients', filename);

      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (error) {
      // Log error but don't throw - file deletion is not critical
      console.error(`Error deleting logo file: ${logoUri}`, error);
    }
  }
}

