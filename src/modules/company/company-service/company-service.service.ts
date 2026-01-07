import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { CompanyService } from './entities/company-service.entity';
import { CreateCompanyServiceDto } from './dto/create-company-service.dto';
import { UpdateCompanyServiceDto } from './dto/update-company-service.dto';

@Injectable()
export class CompanyServiceService {
  constructor(
    @InjectModel(CompanyService)
    private companyServiceModel: typeof CompanyService,
  ) {}

  async create(createCompanyServiceDto: CreateCompanyServiceDto): Promise<CompanyService> {
    return this.companyServiceModel.create({
      ...createCompanyServiceDto,
      isActive: createCompanyServiceDto.isActive ?? true,
    });
  }

  async findAll(): Promise<CompanyService[]> {
    return this.companyServiceModel.findAll({
      order: [['title', 'ASC']],
    });
  }

  async findOne(id: number): Promise<CompanyService> {
    const service = await this.companyServiceModel.findByPk(id);

    if (!service) {
      throw new NotFoundException(`Company service with ID ${id} not found`);
    }

    return service;
  }

  async update(
    id: number,
    updateCompanyServiceDto: UpdateCompanyServiceDto,
  ): Promise<CompanyService> {
    const service = await this.findOne(id);

    // If a new image is being uploaded, delete the old image file
    if (updateCompanyServiceDto.imageUri && service.imageUri !== updateCompanyServiceDto.imageUri) {
      this.deleteImageFile(service.imageUri);
    }

    await service.update(updateCompanyServiceDto);

    return service.reload();
  }

  async remove(id: number): Promise<void> {
    const service = await this.findOne(id);

    // Delete the associated image file
    if (service.imageUri) {
      this.deleteImageFile(service.imageUri);
    }

    await service.destroy();
  }

  /**
   * Delete image file from the filesystem
   */
  private deleteImageFile(imageUri: string): void {
    try {
      // Extract filename from URI (e.g., /uploads/company-services/filename.jpg)
      const filename = imageUri.replace('/uploads/company-services/', '');
      const filePath = join(process.cwd(), 'uploads', 'company-services', filename);

      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (error) {
      // Log error but don't throw - file deletion is not critical
      console.error(`Error deleting image file: ${imageUri}`, error);
    }
  }
}

