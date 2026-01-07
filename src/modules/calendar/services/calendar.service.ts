import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Event } from '../entities/event.entity';
import { EventType } from '../entities/event-type.entity';
import { EventCategory } from '../entities/event-category.entity';
import { User } from '../../auth/entities/user.entity';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EventQueryDto } from '../dto/event-query.dto';
import { EventResponseDto } from '../dto/event-response.dto';

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(Event)
    private eventModel: typeof Event,
    @InjectModel(EventType)
    private eventTypeModel: typeof EventType,
    @InjectModel(EventCategory)
    private eventCategoryModel: typeof EventCategory,
  ) {}

  async create(createDto: CreateEventDto, createdById: number): Promise<Event> {
    // Validate dates
    const startDate = new Date(createDto.startDate);
    const endDate = new Date(createDto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Validate event type exists
    const eventType = await this.eventTypeModel.findByPk(createDto.eventTypeId);
    if (!eventType) {
      throw new NotFoundException(`Event type with ID ${createDto.eventTypeId} not found`);
    }

    // Validate event category exists if provided
    if (createDto.eventCategoryId) {
      const eventCategory = await this.eventCategoryModel.findByPk(createDto.eventCategoryId);
      if (!eventCategory) {
        throw new NotFoundException(`Event category with ID ${createDto.eventCategoryId} not found`);
      }
    }

    return this.eventModel.create({
      title: createDto.title,
      description: createDto.description,
      startDate,
      endDate,
      location: createDto.location,
      eventTypeId: createDto.eventTypeId,
      eventCategoryId: createDto.eventCategoryId ?? null,
      createdById,
      isAllDay: createDto.isAllDay ?? false,
    });
  }

  async findAll(queryDto?: EventQueryDto): Promise<Event[]> {
    const where: any = {};

    if (queryDto?.eventTypeId) {
      where.eventTypeId = queryDto.eventTypeId;
    }

    if (queryDto?.eventCategoryId) {
      where.eventCategoryId = queryDto.eventCategoryId;
    }

    // Date range filtering
    if (queryDto?.startDate && queryDto?.endDate) {
      const startDate = new Date(queryDto.startDate);
      const endDate = new Date(queryDto.endDate);
      // Events that overlap with the date range
      where[Op.or] = [
        {
          startDate: { [Op.between]: [startDate, endDate] },
        },
        {
          endDate: { [Op.between]: [startDate, endDate] },
        },
        {
          [Op.and]: [
            { startDate: { [Op.lte]: startDate } },
            { endDate: { [Op.gte]: endDate } },
          ],
        },
      ];
    }

    return this.eventModel.findAll({
      where,
      include: [
        {
          model: EventType,
          as: 'eventType',
        },
        {
          model: EventCategory,
          as: 'eventCategory',
          required: false,
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'emailAddress'],
        },
      ],
      order: [['startDate', 'ASC']],
    });
  }

  async findOne(id: number): Promise<Event> {
    const event = await this.eventModel.findByPk(id, {
      include: [
        {
          model: EventType,
          as: 'eventType',
        },
        {
          model: EventCategory,
          as: 'eventCategory',
          required: false,
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'emailAddress'],
        },
      ],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async update(id: number, updateDto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);

    // Validate dates if provided
    if (updateDto.startDate || updateDto.endDate) {
      const startDate = updateDto.startDate ? new Date(updateDto.startDate) : event.startDate;
      const endDate = updateDto.endDate ? new Date(updateDto.endDate) : event.endDate;

      if (endDate <= startDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    // Validate event type if provided
    if (updateDto.eventTypeId) {
      const eventType = await this.eventTypeModel.findByPk(updateDto.eventTypeId);
      if (!eventType) {
        throw new NotFoundException(`Event type with ID ${updateDto.eventTypeId} not found`);
      }
    }

    // Validate event category if provided
    if (updateDto.eventCategoryId !== undefined) {
      if (updateDto.eventCategoryId !== null) {
        const eventCategory = await this.eventCategoryModel.findByPk(updateDto.eventCategoryId);
        if (!eventCategory) {
          throw new NotFoundException(`Event category with ID ${updateDto.eventCategoryId} not found`);
        }
      }
    }

    await event.update({
      title: updateDto.title ?? event.title,
      description: updateDto.description !== undefined ? updateDto.description : event.description,
      startDate: updateDto.startDate ? new Date(updateDto.startDate) : event.startDate,
      endDate: updateDto.endDate ? new Date(updateDto.endDate) : event.endDate,
      location: updateDto.location !== undefined ? updateDto.location : event.location,
      eventTypeId: updateDto.eventTypeId ?? event.eventTypeId,
      eventCategoryId: updateDto.eventCategoryId !== undefined ? updateDto.eventCategoryId : event.eventCategoryId,
      isAllDay: updateDto.isAllDay !== undefined ? updateDto.isAllDay : event.isAllDay,
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const event = await this.findOne(id);
    await event.destroy();
  }

  async getDayView(date: string): Promise<Event[]> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return this.eventModel.findAll({
      where: {
        [Op.or]: [
          {
            // Events that start on this day
            startDate: {
              [Op.gte]: targetDate,
              [Op.lt]: nextDay,
            },
          },
          {
            // Events that end on this day
            endDate: {
              [Op.gte]: targetDate,
              [Op.lt]: nextDay,
            },
          },
          {
            // Events that span across this day
            [Op.and]: [
              { startDate: { [Op.lt]: targetDate } },
              { endDate: { [Op.gte]: nextDay } },
            ],
          },
        ],
      },
      include: [
        {
          model: EventType,
          as: 'eventType',
        },
        {
          model: EventCategory,
          as: 'eventCategory',
          required: false,
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'emailAddress'],
        },
      ],
      order: [['startDate', 'ASC']],
    });
  }

  async getWeekView(startDate: string): Promise<Event[]> {
    const weekStart = new Date(startDate);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return this.eventModel.findAll({
      where: {
        [Op.or]: [
          {
            // Events that start during the week
            startDate: {
              [Op.gte]: weekStart,
              [Op.lt]: weekEnd,
            },
          },
          {
            // Events that end during the week
            endDate: {
              [Op.gte]: weekStart,
              [Op.lt]: weekEnd,
            },
          },
          {
            // Events that span across the week
            [Op.and]: [
              { startDate: { [Op.lt]: weekStart } },
              { endDate: { [Op.gte]: weekEnd } },
            ],
          },
        ],
      },
      include: [
        {
          model: EventType,
          as: 'eventType',
        },
        {
          model: EventCategory,
          as: 'eventCategory',
          required: false,
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'emailAddress'],
        },
      ],
      order: [['startDate', 'ASC']],
    });
  }

  async getMonthView(year: number, month: number): Promise<Event[]> {
    // Month is 0-indexed in JavaScript Date, so subtract 1
    const monthStart = new Date(year, month - 1, 1);
    monthStart.setHours(0, 0, 0, 0);
    // Get the last day of the month by using the first day of next month and subtracting 1 day
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    return this.eventModel.findAll({
      where: {
        [Op.or]: [
          {
            // Events that start during the month
            startDate: {
              [Op.gte]: monthStart,
              [Op.lte]: monthEnd,
            },
          },
          {
            // Events that end during the month
            endDate: {
              [Op.gte]: monthStart,
              [Op.lte]: monthEnd,
            },
          },
          {
            // Events that span across the month
            [Op.and]: [
              { startDate: { [Op.lt]: monthStart } },
              { endDate: { [Op.gt]: monthEnd } },
            ],
          },
        ],
      },
      include: [
        {
          model: EventType,
          as: 'eventType',
        },
        {
          model: EventCategory,
          as: 'eventCategory',
          required: false,
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'emailAddress'],
        },
      ],
      order: [['startDate', 'ASC']],
    });
  }

  mapToResponse(event: Event): EventResponseDto {
    const response: EventResponseDto = {
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      eventTypeId: event.eventTypeId,
      eventCategoryId: event.eventCategoryId,
      createdById: event.createdById,
      isAllDay: event.isAllDay,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };

    if (event.eventType) {
      response.eventType = {
        id: event.eventType.id,
        name: event.eventType.name,
        description: event.eventType.description,
        color: event.eventType.color,
      };
    }

    if (event.eventCategory) {
      response.eventCategory = {
        id: event.eventCategory.id,
        name: event.eventCategory.name,
        description: event.eventCategory.description,
        color: event.eventCategory.color,
      };
    }

    if (event.createdBy) {
      response.createdBy = {
        id: event.createdBy.id,
        name: event.createdBy.name,
        emailAddress: event.createdBy.emailAddress,
      };
    }

    return response;
  }
}

