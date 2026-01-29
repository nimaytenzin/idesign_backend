import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { CalendarEvent } from './entities/calendar-event.entity';
import { User } from '../../auth/entities/user.entity';
import { RecurrenceType } from './entities/recurrence-type.enum';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { CreateRecurringCalendarEventDto } from './dto/create-recurring-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CalendarEventQueryDto } from './dto/calendar-event-query.dto';
import { CalendarEventResponseDto } from './dto/calendar-event-response.dto';

@Injectable()
export class CalendarEventService {
  constructor(
    @InjectModel(CalendarEvent)
    private calendarEventModel: typeof CalendarEvent,
  ) {}

  /**
   * Generate occurrence dates for a recurring event (date part only, no time).
   */
  private getRecurrenceOccurrenceDates(dto: CreateRecurringCalendarEventDto): Date[] {
    const startFrom = new Date(dto.startFrom + 'T00:00:00.000Z');
    const endAt = new Date(dto.endAt + 'T23:59:59.999Z');
    if (startFrom > endAt) {
      throw new BadRequestException('startFrom must be on or before endAt');
    }

    const dates: Date[] = [];

    if (dto.recurrenceType === RecurrenceType.WEEKLY) {
      const dayOfWeek = dto.dayOfWeek!;
      const targetGetDay = dayOfWeek === 7 ? 0 : dayOfWeek;
      const d = new Date(startFrom);
      d.setUTCHours(0, 0, 0, 0);
      while (d.getUTCDay() !== targetGetDay) {
        d.setUTCDate(d.getUTCDate() + 1);
        if (d > endAt) return dates;
      }
      while (d <= endAt) {
        dates.push(new Date(d));
        d.setUTCDate(d.getUTCDate() + 7);
      }
      return dates;
    }

    if (dto.recurrenceType === RecurrenceType.MONTHLY) {
      const dayOfMonth = dto.dayOfMonth!;
      const lastDayInMonth = (y: number, m: number) =>
        new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      let y = startFrom.getUTCFullYear();
      let m = startFrom.getUTCMonth();
      const d = startFrom.getUTCDate();
      if (d > dayOfMonth) {
        m += 1;
        if (m > 11) {
          m = 0;
          y += 1;
        }
      }
      while (true) {
        const last = lastDayInMonth(y, m);
        const day = Math.min(dayOfMonth, last);
        const occ = new Date(Date.UTC(y, m, day, 0, 0, 0, 0));
        if (occ > endAt) break;
        if (occ >= startFrom) dates.push(occ);
        m += 1;
        if (m > 11) {
          m = 0;
          y += 1;
        }
      }
      return dates;
    }

    if (dto.recurrenceType === RecurrenceType.ANNUALLY) {
      const month = dto.month! - 1;
      const dayOfMonth = dto.dayOfMonth!;
      const lastDayInMonth = (y: number, m: number) =>
        new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      let y = startFrom.getUTCFullYear();
      const firstOcc = new Date(
        Date.UTC(y, month, Math.min(dayOfMonth, lastDayInMonth(y, month)), 0, 0, 0, 0),
      );
      if (firstOcc < startFrom) y += 1;
      while (true) {
        const last = lastDayInMonth(y, month);
        const day = Math.min(dayOfMonth, last);
        const occ = new Date(Date.UTC(y, month, day, 0, 0, 0, 0));
        if (occ > endAt) break;
        dates.push(occ);
        y += 1;
      }
      return dates;
    }

    return dates;
  }

  /**
   * Parse time string "HH:mm" or "HH:mm:ss" into [hour, minute, second].
   */
  private parseTime(time: string): [number, number, number] {
    const parts = time.split(':');
    const hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);
    const second = parts.length >= 3 ? parseInt(parts[2], 10) : 0;
    return [hour, minute, second];
  }

  /**
   * Create recurring calendar events: generates one CalendarEvent per occurrence for WEEKLY, MONTHLY, or ANNUALLY.
   */
  async createRecurring(
    dto: CreateRecurringCalendarEventDto,
    createdById: number,
  ): Promise<CalendarEvent[]> {
    const occurrenceDates = this.getRecurrenceOccurrenceDates(dto);
    if (occurrenceDates.length === 0) {
      throw new BadRequestException(
        'No occurrences in the given date range. Check startFrom, endAt, and recurrence pattern.',
      );
    }

    const [hour, minute, second] = this.parseTime(dto.time);
    const durationMinutes = dto.durationMinutes ?? 60;
    const allDay = dto.allDay ?? false;

    const events: CalendarEvent[] = [];
    for (const occDate of occurrenceDates) {
      const start = new Date(occDate);
      start.setUTCHours(hour, minute, second, 0);
      let end: Date;
      if (allDay) {
        end = new Date(start);
        end.setUTCHours(23, 59, 59, 999);
      } else {
        end = new Date(start.getTime() + durationMinutes * 60 * 1000);
      }

      const event = await this.calendarEventModel.create({
        title: dto.title,
        start,
        end,
        allDay,
        backgroundColor: dto.backgroundColor ?? null,
        borderColor: dto.borderColor ?? null,
        textColor: dto.textColor ?? null,
        location: dto.location ?? null,
        description: dto.description ?? null,
        createdById,
      });
      events.push(event);
    }
    return events;
  }

  async create(createDto: CreateCalendarEventDto, createdById: number): Promise<CalendarEvent> {
    // Validate dates
    const start = new Date(createDto.start);
    const allDay = createDto.allDay ?? false;
    let end = createDto.end ? new Date(createDto.end) : null;

    if (allDay) {
      // For all-day events, if end is not provided or is before start, set it to end of start day
      if (!end) {
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
      } else {
        // Compare date parts only (ignore time)
        const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        if (endDate < startDate) {
          // Auto-fix: set end to end of start day for single-day all-day events
          end = new Date(start);
          end.setHours(23, 59, 59, 999);
        } else {
          // Set end to end of the end day for all-day events
          end.setHours(23, 59, 59, 999);
        }
      }
    } else {
      // For timed events, validate end is after start
      if (end && end <= start) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    return this.calendarEventModel.create({
      title: createDto.title,
      start,
      end,
      allDay,
      backgroundColor: createDto.backgroundColor ?? null,
      borderColor: createDto.borderColor ?? null,
      textColor: createDto.textColor ?? null,
      location: createDto.location ?? null,
      description: createDto.description ?? null,
      createdById,
    });
  }

  async findAll(queryDto?: CalendarEventQueryDto): Promise<CalendarEvent[]> {
    const where: any = {};

    // Date range filtering
    if (queryDto?.start && queryDto?.end) {
      const startDate = new Date(queryDto.start);
      const endDate = new Date(queryDto.end);
      // Events that overlap with the date range
      where[Op.or] = [
        {
          start: { [Op.between]: [startDate, endDate] },
        },
        {
          end: { [Op.between]: [startDate, endDate] },
        },
        {
          [Op.and]: [
            { start: { [Op.lte]: startDate } },
            { end: { [Op.gte]: endDate } },
          ],
        },
      ];
    }

    return this.calendarEventModel.findAll({
      where,
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'emailAddress'],
        },
      ],
      order: [['start', 'ASC']],
    });
  }

  async findOne(id: number): Promise<CalendarEvent> {
    const event = await this.calendarEventModel.findByPk(id, {
      include: [
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

  async update(id: number, updateDto: UpdateCalendarEventDto): Promise<CalendarEvent> {
    const event = await this.findOne(id);

    // Validate dates if provided
    if (updateDto.start || updateDto.end !== undefined || updateDto.allDay !== undefined) {
      const start = updateDto.start ? new Date(updateDto.start) : event.start;
      const allDay = updateDto.allDay !== undefined ? updateDto.allDay : event.allDay;
      let end = updateDto.end !== undefined ? (updateDto.end ? new Date(updateDto.end) : null) : event.end;

      if (allDay) {
        // For all-day events, if end is not provided or is before start, set it to end of start day
        if (!end) {
          end = new Date(start);
          end.setHours(23, 59, 59, 999);
        } else {
          // Compare date parts only (ignore time)
          const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
          const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
          if (endDate < startDate) {
            // Auto-fix: set end to end of start day for single-day all-day events
            end = new Date(start);
            end.setHours(23, 59, 59, 999);
          } else {
            // Set end to end of the end day for all-day events
            end.setHours(23, 59, 59, 999);
          }
        }
      } else {
        // For timed events, validate end is after start
        if (end && end <= start) {
          throw new BadRequestException('End date must be after start date');
        }
      }
    }

    const finalStart = updateDto.start ? new Date(updateDto.start) : event.start;
    const finalAllDay = updateDto.allDay !== undefined ? updateDto.allDay : event.allDay;
    let finalEnd = updateDto.end !== undefined ? (updateDto.end ? new Date(updateDto.end) : null) : event.end;

    // For all-day events, if end is not provided, set it to end of start day
    if (finalAllDay && !finalEnd) {
      finalEnd = new Date(finalStart);
      finalEnd.setHours(23, 59, 59, 999);
    }

    await event.update({
      title: updateDto.title ?? event.title,
      start: finalStart,
      end: finalEnd,
      allDay: finalAllDay,
      backgroundColor: updateDto.backgroundColor !== undefined ? updateDto.backgroundColor : event.backgroundColor,
      borderColor: updateDto.borderColor !== undefined ? updateDto.borderColor : event.borderColor,
      textColor: updateDto.textColor !== undefined ? updateDto.textColor : event.textColor,
      location: updateDto.location !== undefined ? updateDto.location : event.location,
      description: updateDto.description !== undefined ? updateDto.description : event.description,
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const event = await this.findOne(id);
    await event.destroy();
  }

  async getDayView(date: string): Promise<CalendarEvent[]> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return this.calendarEventModel.findAll({
      where: {
        [Op.or]: [
          {
            // Events that start on this day
            start: {
              [Op.gte]: targetDate,
              [Op.lt]: nextDay,
            },
          },
          {
            // Events that end on this day
            end: {
              [Op.gte]: targetDate,
              [Op.lt]: nextDay,
            },
          },
          {
            // Events that span across this day
            [Op.and]: [
              { start: { [Op.lt]: targetDate } },
              { end: { [Op.gte]: nextDay } },
            ],
          },
        ],
      },
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'emailAddress'],
        },
      ],
      order: [['start', 'ASC']],
    });
  }

  async getWeekView(startDate: string): Promise<CalendarEvent[]> {
    const weekStart = new Date(startDate);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return this.calendarEventModel.findAll({
      where: {
        [Op.or]: [
          {
            // Events that start during the week
            start: {
              [Op.gte]: weekStart,
              [Op.lt]: weekEnd,
            },
          },
          {
            // Events that end during the week
            end: {
              [Op.gte]: weekStart,
              [Op.lt]: weekEnd,
            },
          },
          {
            // Events that span across the week
            [Op.and]: [
              { start: { [Op.lt]: weekStart } },
              { end: { [Op.gte]: weekEnd } },
            ],
          },
        ],
      },
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'emailAddress'],
        },
      ],
      order: [['start', 'ASC']],
    });
  }

  /**
   * Returns events that overlap with the current month (UTC).
   */
  async getThisMonthEvents(): Promise<CalendarEvent[]> {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const monthStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const monthEnd = new Date(Date.UTC(year, month, lastDay, 23, 59, 59, 999));

    return this.calendarEventModel.findAll({
      where: {
        [Op.or]: [
          { start: { [Op.gte]: monthStart, [Op.lte]: monthEnd } },
          { end: { [Op.gte]: monthStart, [Op.lte]: monthEnd } },
          {
            [Op.and]: [
              { start: { [Op.lte]: monthStart } },
              { end: { [Op.gte]: monthEnd } },
            ],
          },
        ],
      },
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'emailAddress'],
        },
      ],
      order: [['start', 'ASC']],
    });
  }

  async getYearView(year: number): Promise<CalendarEvent[]> {
    // Get the start of the year (January 1st)
    const yearStart = new Date(year, 0, 1);
    yearStart.setHours(0, 0, 0, 0);
    // Get the end of the year (December 31st)
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    return this.calendarEventModel.findAll({
      where: {
        [Op.or]: [
          {
            // Events that start during the year
            start: {
              [Op.gte]: yearStart,
              [Op.lte]: yearEnd,
            },
          },
          {
            // Events that end during the year
            end: {
              [Op.gte]: yearStart,
              [Op.lte]: yearEnd,
            },
          },
          {
            // Events that span across the year
            [Op.and]: [
              { start: { [Op.lt]: yearStart } },
              { end: { [Op.gt]: yearEnd } },
            ],
          },
        ],
      },
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'emailAddress'],
        },
      ],
      order: [['start', 'ASC']],
    });
  }

  mapToResponse(event: CalendarEvent): CalendarEventResponseDto {
    // Build extendedProps from location and description
    const extendedProps: Record<string, any> = {};

    if (event.location !== null && event.location !== undefined) {
      extendedProps.location = event.location;
    }

    if (event.description !== null && event.description !== undefined) {
      extendedProps.description = event.description;
    }

    const response: CalendarEventResponseDto = {
      id: event.id.toString(),
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      textColor: event.textColor,
      extendedProps: Object.keys(extendedProps).length > 0 ? extendedProps : null,
      createdById: event.createdById,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };

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
