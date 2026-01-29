import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { CalendarEventService } from './calendar-event.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { CreateRecurringCalendarEventDto } from './dto/create-recurring-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CalendarEventQueryDto } from './dto/calendar-event-query.dto';
import { CalendarEventResponseDto } from './dto/calendar-event-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('calendar-events')
@UseGuards(JwtAuthGuard)
export class CalendarEventController {
  constructor(private readonly calendarEventService: CalendarEventService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createEventDto: CreateCalendarEventDto,
    @Request() req,
  ): Promise<CalendarEventResponseDto> {
    const event = await this.calendarEventService.create(createEventDto, req.user.id);
    return this.calendarEventService.mapToResponse(event);
  }

  /**
   * Create recurring events: WEEKLY (e.g. every Monday 5pm), MONTHLY (e.g. 25th of every month), or ANNUALLY (e.g. Jan 25 every year).
   * Generates one calendar event per occurrence in the date range.
   * @route POST /calendar-events/recurring
   */
  @Post('recurring')
  @HttpCode(HttpStatus.CREATED)
  async createRecurring(
    @Body() dto: CreateRecurringCalendarEventDto,
    @Request() req,
  ): Promise<CalendarEventResponseDto[]> {
    const events = await this.calendarEventService.createRecurring(dto, req.user.id);
    return events.map((event) => this.calendarEventService.mapToResponse(event));
  }

  @Get()
  async findAll(@Query() queryDto: CalendarEventQueryDto): Promise<CalendarEventResponseDto[]> {
    const events = await this.calendarEventService.findAll(queryDto);
    return events.map((event) => this.calendarEventService.mapToResponse(event));
  }

  /**
   * Events in the current month (UTC). Any event that overlaps the month is included.
   * @route GET /calendar-events/this-month
   */
  @Get('this-month')
  async getThisMonth(): Promise<CalendarEventResponseDto[]> {
    const events = await this.calendarEventService.getThisMonthEvents();
    return events.map((event) => this.calendarEventService.mapToResponse(event));
  }

  @Get('calendar/:year')
  async getYearView(
    @Param('year', ParseIntPipe) year: number,
  ): Promise<CalendarEventResponseDto[]> {
    const events = await this.calendarEventService.getYearView(year);
    return events.map((event) => this.calendarEventService.mapToResponse(event));
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CalendarEventResponseDto> {
    const event = await this.calendarEventService.findOne(id);
    return this.calendarEventService.mapToResponse(event);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventDto: UpdateCalendarEventDto,
  ): Promise<CalendarEventResponseDto> {
    const event = await this.calendarEventService.update(id, updateEventDto);
    return this.calendarEventService.mapToResponse(event);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.calendarEventService.remove(id);
  }
}
