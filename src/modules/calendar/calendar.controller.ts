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
import { CalendarService } from './services/calendar.service';
import { EventTypeService } from './services/event-type.service';
import { EventCategoryService } from './services/event-category.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventQueryDto } from './dto/event-query.dto';
import { EventResponseDto } from './dto/event-response.dto';
import { CreateEventTypeDto } from './dto/create-event-type.dto';
import { UpdateEventTypeDto } from './dto/update-event-type.dto';
import { EventTypeResponseDto } from './dto/event-type-response.dto';
import { CreateEventCategoryDto } from './dto/create-event-category.dto';
import { UpdateEventCategoryDto } from './dto/update-event-category.dto';
import { EventCategoryResponseDto } from './dto/event-category-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('events')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly eventTypeService: EventTypeService,
    private readonly eventCategoryService: EventCategoryService,
  ) {}

  // Event endpoints
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createEventDto: CreateEventDto,
    @Request() req,
  ): Promise<EventResponseDto> {
    const event = await this.calendarService.create(createEventDto, req.user.id);
    return this.calendarService.mapToResponse(event);
  }

  @Get()
  async findAll(@Query() queryDto: EventQueryDto): Promise<EventResponseDto[]> {
    const events = await this.calendarService.findAll(queryDto);
    return events.map((event) => this.calendarService.mapToResponse(event));
  }

  @Get('calendar/day/:date')
  async getDayView(@Param('date') date: string): Promise<EventResponseDto[]> {
    const events = await this.calendarService.getDayView(date);
    return events.map((event) => this.calendarService.mapToResponse(event));
  }

  @Get('calendar/week/:startDate')
  async getWeekView(@Param('startDate') startDate: string): Promise<EventResponseDto[]> {
    const events = await this.calendarService.getWeekView(startDate);
    return events.map((event) => this.calendarService.mapToResponse(event));
  }

  @Get('calendar/month/:year/:month')
  async getMonthView(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ): Promise<EventResponseDto[]> {
    const events = await this.calendarService.getMonthView(year, month);
    return events.map((event) => this.calendarService.mapToResponse(event));
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<EventResponseDto> {
    const event = await this.calendarService.findOne(id);
    return this.calendarService.mapToResponse(event);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventDto: UpdateEventDto,
  ): Promise<EventResponseDto> {
    const event = await this.calendarService.update(id, updateEventDto);
    return this.calendarService.mapToResponse(event);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.calendarService.remove(id);
  }

  // Event Type endpoints
  @Post('event-types')
  @HttpCode(HttpStatus.CREATED)
  async createEventType(
    @Body() createEventTypeDto: CreateEventTypeDto,
  ): Promise<EventTypeResponseDto> {
    const eventType = await this.eventTypeService.create(createEventTypeDto);
    return this.eventTypeService.mapToResponse(eventType);
  }

  @Get('event-types')
  async findAllEventTypes(): Promise<EventTypeResponseDto[]> {
    const eventTypes = await this.eventTypeService.findAll();
    return eventTypes.map((eventType) => this.eventTypeService.mapToResponse(eventType));
  }

  @Patch('event-types/:id')
  async updateEventType(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventTypeDto: UpdateEventTypeDto,
  ): Promise<EventTypeResponseDto> {
    const eventType = await this.eventTypeService.update(id, updateEventTypeDto);
    return this.eventTypeService.mapToResponse(eventType);
  }

  @Delete('event-types/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeEventType(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.eventTypeService.remove(id);
  }

  // Event Category endpoints
  @Post('event-categories')
  @HttpCode(HttpStatus.CREATED)
  async createEventCategory(
    @Body() createEventCategoryDto: CreateEventCategoryDto,
  ): Promise<EventCategoryResponseDto> {
    const eventCategory = await this.eventCategoryService.create(createEventCategoryDto);
    return this.eventCategoryService.mapToResponse(eventCategory);
  }

  @Get('event-categories')
  async findAllEventCategories(): Promise<EventCategoryResponseDto[]> {
    const eventCategories = await this.eventCategoryService.findAll();
    return eventCategories.map((eventCategory) =>
      this.eventCategoryService.mapToResponse(eventCategory),
    );
  }

  @Patch('event-categories/:id')
  async updateEventCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventCategoryDto: UpdateEventCategoryDto,
  ): Promise<EventCategoryResponseDto> {
    const eventCategory = await this.eventCategoryService.update(id, updateEventCategoryDto);
    return this.eventCategoryService.mapToResponse(eventCategory);
  }

  @Delete('event-categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeEventCategory(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.eventCategoryService.remove(id);
  }
}

