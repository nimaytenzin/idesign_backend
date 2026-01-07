import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class AnalyticsSchedulerService {
  private readonly logger = new Logger(AnalyticsSchedulerService.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Run monthly aggregation on the 1st day of each month at 2:00 AM
   * This aggregates the previous month's visitors and cleans up old records
   */
  @Cron('0 2 1 * *') // 2 AM on the 1st day of every month
  async handleMonthlyAggregation() {
    this.logger.log('Running scheduled monthly aggregation...');
    try {
      await this.analyticsService.processMonthlyAggregation();
      this.logger.log('Scheduled monthly aggregation completed successfully');
    } catch (error) {
      this.logger.error(`Scheduled monthly aggregation failed: ${error.message}`, error.stack);
    }
  }
}

