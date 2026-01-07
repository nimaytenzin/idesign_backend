import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TrackVisitorDto } from './dto/track-visitor.dto';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import {
  VisitorStatsResponseDto,
  VisitorsByCountryDto,
  VisitorsByDeviceDto,
  VisitorsByReferrerDto,
  VisitorsByDistrictDto,
} from './dto/visitor-stats-response.dto';
import { VisitorTrackingInterceptor } from './visitor-tracking.interceptor';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  async trackVisitor(
    @Request() req,
    @Body() trackVisitorDto?: TrackVisitorDto,
  ): Promise<{ message: string }> {
    // Manual tracking endpoint - can be used if needed
    // This endpoint itself won't be tracked by the interceptor
    await this.analyticsService.trackVisitor(req, trackVisitorDto?.orderId);
    return { message: 'Visitor tracked successfully' };
  }

  @Get('stats')
  async getVisitorStats(
    @Query() query: AnalyticsQueryDto,
  ): Promise<VisitorStatsResponseDto> {
    return this.analyticsService.getVisitorStats(query);
  }

  @Get('visitors/by-country')
  async getVisitorsByCountry(
    @Query() query: AnalyticsQueryDto,
  ): Promise<VisitorsByCountryDto[]> {
    return this.analyticsService.getVisitorsByCountry(query);
  }

  @Get('visitors/by-device')
  async getVisitorsByDevice(
    @Query() query: AnalyticsQueryDto,
  ): Promise<VisitorsByDeviceDto[]> {
    return this.analyticsService.getVisitorsByDevice(query);
  }

  @Get('visitors/by-referrer')
  async getVisitorsByReferrer(
    @Query() query: AnalyticsQueryDto,
  ): Promise<VisitorsByReferrerDto[]> {
    return this.analyticsService.getVisitorsByReferrer(query);
  }

  @Get('visitors/by-district')
  async getVisitorsByDistrict(
    @Query('country') country?: string,
    @Query() query?: AnalyticsQueryDto,
  ): Promise<VisitorsByDistrictDto[]> {
    return this.analyticsService.getVisitorsByDistrict(country, query);
  }

  @Get('visitors')
  async getVisitors(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getVisitors(query);
  }

  @Get('monthly-stats')
  async getMonthlyStats(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);
    return this.analyticsService.getMonthlyStats(yearNum, monthNum);
  }

  @Post('aggregate-monthly')
  async triggerMonthlyAggregation() {
    await this.analyticsService.processMonthlyAggregation();
    return { message: 'Monthly aggregation completed successfully' };
  }
}

