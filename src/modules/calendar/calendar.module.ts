import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Event } from './entities/event.entity';
import { EventType } from './entities/event-type.entity';
import { EventCategory } from './entities/event-category.entity';
import { User } from '../auth/entities/user.entity';
import { CalendarService } from './services/calendar.service';
import { EventTypeService } from './services/event-type.service';
import { EventCategoryService } from './services/event-category.service';
import { CalendarController } from './calendar.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([Event, EventType, EventCategory, User]),
  ],
  controllers: [CalendarController],
  providers: [CalendarService, EventTypeService, EventCategoryService],
  exports: [CalendarService, EventTypeService, EventCategoryService],
})
export class CalendarModule {}

