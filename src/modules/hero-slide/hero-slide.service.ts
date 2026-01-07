import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { HeroSlide } from './entities/hero-slide.entity';
import { CreateHeroSlideDto } from './dto/create-hero-slide.dto';
import { UpdateHeroSlideDto } from './dto/update-hero-slide.dto';

@Injectable()
export class HeroSlideService {
  constructor(
    @InjectModel(HeroSlide)
    private heroSlideModel: typeof HeroSlide,
  ) {}

  async create(createHeroSlideDto: CreateHeroSlideDto): Promise<HeroSlide> {
    // Validate that imageUri is provided
    if (!createHeroSlideDto.imageUri) {
      throw new BadRequestException('Image is required');
    }

    // If order is not provided, set it to the next available order
    if (createHeroSlideDto.order === undefined) {
      const maxOrder = (await this.heroSlideModel.max('order')) as number | null;
      createHeroSlideDto.order = (maxOrder ?? 0) + 1;
    }

    return this.heroSlideModel.create({
      ...createHeroSlideDto,
      isActive: createHeroSlideDto.isActive ?? true,
    });
  }

  async findAll(includeInactive: boolean = false): Promise<HeroSlide[]> {
    const where: any = {};
    
    if (!includeInactive) {
      where.isActive = true;
    }

    return this.heroSlideModel.findAll({
      where,
      order: [['order', 'ASC'], ['createdAt', 'DESC']],
    });
  }

  async findOne(id: number): Promise<HeroSlide> {
    const heroSlide = await this.heroSlideModel.findByPk(id);

    if (!heroSlide) {
      throw new NotFoundException(`Hero slide with ID ${id} not found`);
    }

    return heroSlide;
  }

  async update(
    id: number,
    updateHeroSlideDto: UpdateHeroSlideDto,
  ): Promise<HeroSlide> {
    const heroSlide = await this.findOne(id);

    // If a new image is being uploaded, delete the old image file
    if (updateHeroSlideDto.imageUri && heroSlide.imageUri !== updateHeroSlideDto.imageUri) {
      this.deleteImageFile(heroSlide.imageUri);
    }

    await heroSlide.update(updateHeroSlideDto);

    return heroSlide.reload();
  }

  async remove(id: number): Promise<void> {
    const heroSlide = await this.findOne(id);
    
    // Delete the associated image file
    if (heroSlide.imageUri) {
      this.deleteImageFile(heroSlide.imageUri);
    }

    await heroSlide.destroy();
  }

  /**
   * Delete image file from the filesystem
   */
  private deleteImageFile(imageUri: string): void {
    try {
      // Extract filename from URI (e.g., /uploads/hero-slides/filename.jpg)
      const filename = imageUri.replace('/uploads/hero-slides/', '');
      const filePath = join(process.cwd(), 'uploads', 'hero-slides', filename);

      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (error) {
      // Log error but don't throw - file deletion is not critical
      console.error(`Error deleting image file: ${imageUri}`, error);
    }
  }

  async reorder(slideIds: number[]): Promise<HeroSlide[]> {
    if (!Array.isArray(slideIds) || slideIds.length === 0) {
      throw new BadRequestException('Slide IDs array is required');
    }

    // Verify all slides exist
    const slides = await this.heroSlideModel.findAll({
      where: { id: slideIds },
    });

    if (slides.length !== slideIds.length) {
      throw new BadRequestException('One or more slide IDs not found');
    }

    // Update order based on array position
    const updatePromises = slideIds.map((id, index) => {
      return this.heroSlideModel.update(
        { order: index + 1 },
        { where: { id } },
      );
    });

    await Promise.all(updatePromises);

    // Return updated slides in new order
    return this.findAll(true);
  }
}

