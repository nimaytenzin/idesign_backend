import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { EventCategory } from '../entities/event-category.entity';
import { CreateEventCategoryDto } from '../dto/create-event-category.dto';
import { UpdateEventCategoryDto } from '../dto/update-event-category.dto';
import { EventCategoryResponseDto } from '../dto/event-category-response.dto';

@Injectable()
export class EventCategoryService {
  constructor(
    @InjectModel(EventCategory)
    private eventCategoryModel: typeof EventCategory,
  ) {}

  async create(createDto: CreateEventCategoryDto): Promise<EventCategory> {
    // Check if name already exists
    const existing = await this.eventCategoryModel.findOne({
      where: { name: createDto.name },
    });

    if (existing) {
      throw new BadRequestException(`Event category with name "${createDto.name}" already exists`);
    }

    return this.eventCategoryModel.create({
      name: createDto.name,
      description: createDto.description,
      color: createDto.color,
    });
  }

  async findAll(): Promise<EventCategory[]> {
    return this.eventCategoryModel.findAll({
      order: [['name', 'ASC']],
    });
  }

  async findOne(id: number): Promise<EventCategory> {
    const eventCategory = await this.eventCategoryModel.findByPk(id);

    if (!eventCategory) {
      throw new NotFoundException(`Event category with ID ${id} not found`);
    }

    return eventCategory;
  }

  async update(id: number, updateDto: UpdateEventCategoryDto): Promise<EventCategory> {
    const eventCategory = await this.findOne(id);

    // Check if new name conflicts with existing
    if (updateDto.name && updateDto.name !== eventCategory.name) {
      const existing = await this.eventCategoryModel.findOne({
        where: { name: updateDto.name },
      });

      if (existing) {
        throw new BadRequestException(`Event category with name "${updateDto.name}" already exists`);
      }
    }

    await eventCategory.update({
      name: updateDto.name ?? eventCategory.name,
      description: updateDto.description !== undefined ? updateDto.description : eventCategory.description,
      color: updateDto.color !== undefined ? updateDto.color : eventCategory.color,
    });

    return eventCategory.reload();
  }

  async remove(id: number): Promise<void> {
    const eventCategory = await this.findOne(id);
    await eventCategory.destroy();
  }

  mapToResponse(eventCategory: EventCategory): EventCategoryResponseDto {
    return {
      id: eventCategory.id,
      name: eventCategory.name,
      description: eventCategory.description,
      color: eventCategory.color,
      createdAt: eventCategory.createdAt,
      updatedAt: eventCategory.updatedAt,
    };
  }
}

