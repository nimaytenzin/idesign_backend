import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { EventType } from '../entities/event-type.entity';
import { CreateEventTypeDto } from '../dto/create-event-type.dto';
import { UpdateEventTypeDto } from '../dto/update-event-type.dto';
import { EventTypeResponseDto } from '../dto/event-type-response.dto';

@Injectable()
export class EventTypeService {
  constructor(
    @InjectModel(EventType)
    private eventTypeModel: typeof EventType,
  ) {}

  async create(createDto: CreateEventTypeDto): Promise<EventType> {
    // Check if name already exists
    const existing = await this.eventTypeModel.findOne({
      where: { name: createDto.name },
    });

    if (existing) {
      throw new BadRequestException(`Event type with name "${createDto.name}" already exists`);
    }

    return this.eventTypeModel.create({
      name: createDto.name,
      description: createDto.description,
      color: createDto.color,
    });
  }

  async findAll(): Promise<EventType[]> {
    return this.eventTypeModel.findAll({
      order: [['name', 'ASC']],
    });
  }

  async findOne(id: number): Promise<EventType> {
    const eventType = await this.eventTypeModel.findByPk(id);

    if (!eventType) {
      throw new NotFoundException(`Event type with ID ${id} not found`);
    }

    return eventType;
  }

  async update(id: number, updateDto: UpdateEventTypeDto): Promise<EventType> {
    const eventType = await this.findOne(id);

    // Check if new name conflicts with existing
    if (updateDto.name && updateDto.name !== eventType.name) {
      const existing = await this.eventTypeModel.findOne({
        where: { name: updateDto.name },
      });

      if (existing) {
        throw new BadRequestException(`Event type with name "${updateDto.name}" already exists`);
      }
    }

    await eventType.update({
      name: updateDto.name ?? eventType.name,
      description: updateDto.description !== undefined ? updateDto.description : eventType.description,
      color: updateDto.color !== undefined ? updateDto.color : eventType.color,
    });

    return eventType.reload();
  }

  async remove(id: number): Promise<void> {
    const eventType = await this.findOne(id);
    await eventType.destroy();
  }

  mapToResponse(eventType: EventType): EventTypeResponseDto {
    return {
      id: eventType.id,
      name: eventType.name,
      description: eventType.description,
      color: eventType.color,
      createdAt: eventType.createdAt,
      updatedAt: eventType.updatedAt,
    };
  }
}

