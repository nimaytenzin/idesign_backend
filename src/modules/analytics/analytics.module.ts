import { Module, Global } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsSchedulerService } from './analytics-scheduler.service';
import { Visitor } from './entities/visitor.entity';
import { VisitorMonthlyStats } from './entities/visitor-monthly-stats.entity';
import { VisitorTrackingInterceptor } from './visitor-tracking.interceptor';

@Global()
@Module({
  imports: [
    SequelizeModule.forFeature([Visitor, VisitorMonthlyStats]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticsSchedulerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: VisitorTrackingInterceptor,
    },
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

