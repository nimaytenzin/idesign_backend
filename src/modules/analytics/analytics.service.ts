import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Request } from 'express';
import * as crypto from 'crypto';
import { Visitor, DeviceType, ReferrerSource } from './entities/visitor.entity';
import { VisitorMonthlyStats } from './entities/visitor-monthly-stats.entity';
import { detectDeviceType } from './utils/device-detector.util';
import { parseReferrerSource } from './utils/referrer-parser.util';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import {
  VisitorStatsResponseDto,
  VisitorsByCountryDto,
  VisitorsByDeviceDto,
  VisitorsByReferrerDto,
  VisitorsByDistrictDto,
} from './dto/visitor-stats-response.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly RETENTION_DAYS = 30; // Keep individual records for 30 days

  constructor(
    @InjectModel(Visitor)
    private visitorModel: typeof Visitor,
    @InjectModel(VisitorMonthlyStats)
    private visitorMonthlyStatsModel: typeof VisitorMonthlyStats,
  ) {}

  /**
   * Extract IP address from request
   */
  private extractIpAddress(req: Request): string {
    // Check for Cloudflare header first
    const cfIp = req.headers['cf-connecting-ip'] as string;
    if (cfIp) return cfIp;

    // Check for X-Forwarded-For header (from proxy/load balancer)
    const xForwardedFor = req.headers['x-forwarded-for'] as string;
    if (xForwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      return xForwardedFor.split(',')[0].trim();
    }

    // Fallback to req.ip or req.connection.remoteAddress
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  /**
   * Extract country from request headers (Cloudflare or other CDN)
   */
  private extractCountry(req: Request): string | null {
    // Cloudflare provides country code in CF-IPCountry header
    const cfCountry = req.headers['cf-ipcountry'] as string;
    if (cfCountry && cfCountry !== 'XX') {
      return cfCountry;
    }

    // Could also check other CDN headers here
    return null;
  }

  /**
   * Generate or extract session ID from request
   */
  private extractSessionId(req: Request): string {
    // Try to get from session if available
    if ((req as any).session?.id) {
      return (req as any).session.id;
    }

    // Try to get from cookies
    const sessionCookie = req.cookies?.['sessionId'] || req.cookies?.['connect.sid'];
    if (sessionCookie) {
      return sessionCookie;
    }

    // Generate a session ID based on IP + User-Agent hash
    const userAgent = req.headers['user-agent'] || '';
    const ip = this.extractIpAddress(req);
    const hash = crypto
      .createHash('md5')
      .update(`${ip}-${userAgent}-${Date.now()}`)
      .digest('hex')
      .substring(0, 16);

    return hash;
  }

  /**
   * Track visitor from request
   */
  async trackVisitor(req: Request, orderId?: number): Promise<Visitor> {
    try {
      const ipAddress = this.extractIpAddress(req);
      const userAgent = req.headers['user-agent'] || '';
      const referrer = req.headers['referer'] || req.headers['referrer'] || undefined;
      const country = this.extractCountry(req);
      const sessionId = this.extractSessionId(req);

      // Detect device type
      const deviceType = detectDeviceType(userAgent);

      // Parse referrer
      const { referrer: parsedReferrer, referrerSource } = parseReferrerSource(
        referrer as string | undefined,
      );

      // Create visitor record
      const visitor = await this.visitorModel.create({
        sessionId,
        ipAddress,
        country: country || null,
        district: null, // Can be enhanced later with IP geolocation service
        deviceType,
        referrer: parsedReferrer,
        referrerSource,
        userAgent,
        visitedAt: new Date(),
        orderId: orderId || null,
      });

      return visitor;
    } catch (error) {
      this.logger.error(`Failed to track visitor: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get overall visitor statistics
   * Uses individual visitor records (last 30 days) and monthly stats (older data when available)
   */
  async getVisitorStats(query?: AnalyticsQueryDto): Promise<VisitorStatsResponseDto> {
    const where: any = {};

    if (query?.startDate || query?.endDate) {
      where.visitedAt = {};
      if (query.startDate) {
        where.visitedAt[Op.gte] = new Date(query.startDate);
      }
      if (query.endDate) {
        where.visitedAt[Op.lte] = new Date(query.endDate);
      }
    }

    if (query?.country) {
      where.country = query.country;
    }

    if (query?.district) {
      where.district = query.district;
    }

    if (query?.deviceType) {
      where.deviceType = query.deviceType;
    }

    if (query?.referrerSource) {
      where.referrerSource = query.referrerSource;
    }

    // Total visitors
    const totalVisitors = await this.visitorModel.count({ where });

    // Unique visitors (by sessionId)
    const uniqueVisitors = await this.visitorModel.count({
      where,
      distinct: true,
      col: 'sessionId',
    });

    // Visitors by country
    const visitorsByCountry = await this.visitorModel.findAll({
      attributes: [
        'country',
        [this.visitorModel.sequelize.fn('COUNT', this.visitorModel.sequelize.col('id')), 'count'],
      ],
      where: {
        ...where,
        country: { [Op.ne]: null },
      },
      group: ['country'],
      order: [[this.visitorModel.sequelize.literal('count'), 'DESC']],
      raw: true,
    });

    // Visitors by device
    const visitorsByDevice = await this.visitorModel.findAll({
      attributes: [
        'deviceType',
        [this.visitorModel.sequelize.fn('COUNT', this.visitorModel.sequelize.col('id')), 'count'],
      ],
      where,
      group: ['deviceType'],
      order: [[this.visitorModel.sequelize.literal('count'), 'DESC']],
      raw: true,
    });

    // Visitors by referrer source
    const visitorsByReferrer = await this.visitorModel.findAll({
      attributes: [
        'referrerSource',
        [this.visitorModel.sequelize.fn('COUNT', this.visitorModel.sequelize.col('id')), 'count'],
      ],
      where,
      group: ['referrerSource'],
      order: [[this.visitorModel.sequelize.literal('count'), 'DESC']],
      raw: true,
    });

    // Visitors by district
    const visitorsByDistrict = await this.visitorModel.findAll({
      attributes: [
        'country',
        'district',
        [this.visitorModel.sequelize.fn('COUNT', this.visitorModel.sequelize.col('id')), 'count'],
      ],
      where: {
        ...where,
        district: { [Op.ne]: null },
      },
      group: ['country', 'district'],
      order: [
        ['country', 'ASC'],
        [this.visitorModel.sequelize.literal('count'), 'DESC'],
      ],
      raw: true,
    });

    return {
      totalVisitors,
      uniqueVisitors,
      visitorsByCountry: visitorsByCountry.map((item: any) => ({
        country: item.country,
        count: parseInt(item.count, 10),
      })),
      visitorsByDevice: visitorsByDevice.map((item: any) => ({
        deviceType: item.deviceType as DeviceType,
        count: parseInt(item.count, 10),
      })),
      visitorsByReferrer: visitorsByReferrer.map((item: any) => ({
        referrerSource: item.referrerSource as ReferrerSource,
        count: parseInt(item.count, 10),
      })),
      visitorsByDistrict: visitorsByDistrict.map((item: any) => ({
        country: item.country,
        district: item.district,
        count: parseInt(item.count, 10),
      })),
    };
  }

  /**
   * Get visitors grouped by country
   */
  async getVisitorsByCountry(query?: AnalyticsQueryDto): Promise<VisitorsByCountryDto[]> {
    const where: any = {};

    if (query?.startDate || query?.endDate) {
      where.visitedAt = {};
      if (query.startDate) {
        where.visitedAt[Op.gte] = new Date(query.startDate);
      }
      if (query.endDate) {
        where.visitedAt[Op.lte] = new Date(query.endDate);
      }
    }

    const results = await this.visitorModel.findAll({
      attributes: [
        'country',
        [this.visitorModel.sequelize.fn('COUNT', this.visitorModel.sequelize.col('id')), 'count'],
      ],
      where: {
        ...where,
        country: { [Op.ne]: null },
      },
      group: ['country'],
      order: [[this.visitorModel.sequelize.literal('count'), 'DESC']],
      raw: true,
    });

    return results.map((item: any) => ({
      country: item.country,
      count: parseInt(item.count, 10),
    }));
  }

  /**
   * Get visitors grouped by device type
   */
  async getVisitorsByDevice(query?: AnalyticsQueryDto): Promise<VisitorsByDeviceDto[]> {
    const where: any = {};

    if (query?.startDate || query?.endDate) {
      where.visitedAt = {};
      if (query.startDate) {
        where.visitedAt[Op.gte] = new Date(query.startDate);
      }
      if (query.endDate) {
        where.visitedAt[Op.lte] = new Date(query.endDate);
      }
    }

    const results = await this.visitorModel.findAll({
      attributes: [
        'deviceType',
        [this.visitorModel.sequelize.fn('COUNT', this.visitorModel.sequelize.col('id')), 'count'],
      ],
      where,
      group: ['deviceType'],
      order: [[this.visitorModel.sequelize.literal('count'), 'DESC']],
      raw: true,
    });

    return results.map((item: any) => ({
      deviceType: item.deviceType as DeviceType,
      count: parseInt(item.count, 10),
    }));
  }

  /**
   * Get visitors grouped by referrer source
   */
  async getVisitorsByReferrer(query?: AnalyticsQueryDto): Promise<VisitorsByReferrerDto[]> {
    const where: any = {};

    if (query?.startDate || query?.endDate) {
      where.visitedAt = {};
      if (query.startDate) {
        where.visitedAt[Op.gte] = new Date(query.startDate);
      }
      if (query.endDate) {
        where.visitedAt[Op.lte] = new Date(query.endDate);
      }
    }

    const results = await this.visitorModel.findAll({
      attributes: [
        'referrerSource',
        [this.visitorModel.sequelize.fn('COUNT', this.visitorModel.sequelize.col('id')), 'count'],
      ],
      where,
      group: ['referrerSource'],
      order: [[this.visitorModel.sequelize.literal('count'), 'DESC']],
      raw: true,
    });

    return results.map((item: any) => ({
      referrerSource: item.referrerSource as ReferrerSource,
      count: parseInt(item.count, 10),
    }));
  }

  /**
   * Get visitors grouped by district
   */
  async getVisitorsByDistrict(
    country?: string,
    query?: AnalyticsQueryDto,
  ): Promise<VisitorsByDistrictDto[]> {
    const where: any = {
      district: { [Op.ne]: null },
    };

    if (country) {
      where.country = country;
    }

    if (query?.startDate || query?.endDate) {
      where.visitedAt = {};
      if (query.startDate) {
        where.visitedAt[Op.gte] = new Date(query.startDate);
      }
      if (query.endDate) {
        where.visitedAt[Op.lte] = new Date(query.endDate);
      }
    }

    const results = await this.visitorModel.findAll({
      attributes: [
        'country',
        'district',
        [this.visitorModel.sequelize.fn('COUNT', this.visitorModel.sequelize.col('id')), 'count'],
      ],
      where,
      group: ['country', 'district'],
      order: [
        ['country', 'ASC'],
        [this.visitorModel.sequelize.literal('count'), 'DESC'],
      ],
      raw: true,
    });

    return results.map((item: any) => ({
      country: item.country,
      district: item.district,
      count: parseInt(item.count, 10),
    }));
  }

  /**
   * Get paginated list of visitors
   */
  async getVisitors(query: AnalyticsQueryDto) {
    const where: any = {};
    const page = query.page || 1;
    const limit = query.limit || 50;
    const offset = (page - 1) * limit;

    if (query.startDate || query.endDate) {
      where.visitedAt = {};
      if (query.startDate) {
        where.visitedAt[Op.gte] = new Date(query.startDate);
      }
      if (query.endDate) {
        where.visitedAt[Op.lte] = new Date(query.endDate);
      }
    }

    if (query.country) {
      where.country = query.country;
    }

    if (query.district) {
      where.district = query.district;
    }

    if (query.deviceType) {
      where.deviceType = query.deviceType;
    }

    if (query.referrerSource) {
      where.referrerSource = query.referrerSource;
    }

    const { rows, count } = await this.visitorModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['visitedAt', 'DESC']],
    });

    return {
      data: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Aggregate visitors for a specific month into monthly stats
   */
  async aggregateMonthlyStats(year: number, month: number): Promise<VisitorMonthlyStats> {
    const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
    
    // Calculate start and end dates for the month
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    this.logger.log(`Aggregating monthly stats for ${yearMonth}`);

    // Get all visitors for this month
    const visitors = await this.visitorModel.findAll({
      where: {
        visitedAt: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
      },
    });

    // Calculate totals
    const totalVisitors = visitors.length;
    const uniqueSessionIds = new Set(visitors.map(v => v.sessionId));
    const uniqueVisitors = uniqueSessionIds.size;

    // Aggregate by country
    const visitorsByCountry: { [country: string]: number } = {};
    visitors.forEach(visitor => {
      if (visitor.country) {
        visitorsByCountry[visitor.country] = (visitorsByCountry[visitor.country] || 0) + 1;
      }
    });

    // Aggregate by device type
    const visitorsByDevice: { [deviceType: string]: number } = {};
    visitors.forEach(visitor => {
      const deviceType = visitor.deviceType;
      visitorsByDevice[deviceType] = (visitorsByDevice[deviceType] || 0) + 1;
    });

    // Aggregate by referrer source
    const visitorsByReferrer: { [referrerSource: string]: number } = {};
    visitors.forEach(visitor => {
      const referrerSource = visitor.referrerSource;
      visitorsByReferrer[referrerSource] = (visitorsByReferrer[referrerSource] || 0) + 1;
    });

    // Aggregate by district
    const districtMap = new Map<string, number>();
    visitors.forEach(visitor => {
      if (visitor.country && visitor.district) {
        const key = `${visitor.country}:${visitor.district}`;
        districtMap.set(key, (districtMap.get(key) || 0) + 1);
      }
    });
    const visitorsByDistrict = Array.from(districtMap.entries()).map(([key, count]) => {
      const [country, district] = key.split(':');
      return { country, district, count };
    });

    // Find or create monthly stats record
    const [monthlyStats, created] = await this.visitorMonthlyStatsModel.findOrCreate({
      where: { yearMonth },
      defaults: {
        yearMonth,
        year,
        month,
        totalVisitors,
        uniqueVisitors,
        visitorsByCountry,
        visitorsByDevice,
        visitorsByReferrer,
        visitorsByDistrict,
      },
    });

    // Update if record already exists (shouldn't happen, but handle it)
    if (!created) {
      await monthlyStats.update({
        totalVisitors,
        uniqueVisitors,
        visitorsByCountry,
        visitorsByDevice,
        visitorsByReferrer,
        visitorsByDistrict,
      });
    }

    this.logger.log(`Monthly stats aggregated for ${yearMonth}: ${totalVisitors} visitors, ${uniqueVisitors} unique`);
    
    return monthlyStats;
  }

  /**
   * Clean up old visitor records, keeping only the last 30 days
   * Also preserves visitors linked to orders
   */
  async cleanupOldVisitors(): Promise<number> {
    const retentionDays = this.RETENTION_DAYS;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    cutoffDate.setHours(0, 0, 0, 0);

    this.logger.log(`Cleaning up visitor records older than ${cutoffDate.toISOString()}`);

    // Delete visitors older than retention period that are not linked to orders
    const result = await this.visitorModel.destroy({
      where: {
        visitedAt: {
          [Op.lt]: cutoffDate,
        },
        orderId: null, // Keep visitors linked to orders
      },
    });

    this.logger.log(`Deleted ${result} old visitor records`);
    return result;
  }

  /**
   * Aggregate last month's visitors and cleanup old records
   * Should be called at the beginning of each month
   */
  async processMonthlyAggregation(): Promise<void> {
    try {
      // Get last month
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const year = lastMonth.getFullYear();
      const month = lastMonth.getMonth() + 1; // JavaScript months are 0-indexed

      this.logger.log(`Starting monthly aggregation for ${year}-${month}`);

      // Aggregate last month's visitors
      await this.aggregateMonthlyStats(year, month);

      // Cleanup old visitors (older than 30 days)
      await this.cleanupOldVisitors();

      this.logger.log('Monthly aggregation completed successfully');
    } catch (error) {
      this.logger.error(`Error during monthly aggregation: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get monthly stats for a specific year and month
   */
  async getMonthlyStats(year: number, month: number): Promise<VisitorMonthlyStats | null> {
    const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
    return this.visitorMonthlyStatsModel.findOne({
      where: { yearMonth },
    });
  }

  /**
   * Get all monthly stats within a date range
   */
  async getMonthlyStatsRange(startYear: number, startMonth: number, endYear: number, endMonth: number): Promise<VisitorMonthlyStats[]> {
    const startYearMonth = `${startYear}-${startMonth.toString().padStart(2, '0')}`;
    const endYearMonth = `${endYear}-${endMonth.toString().padStart(2, '0')}`;

    return this.visitorMonthlyStatsModel.findAll({
      where: {
        yearMonth: {
          [Op.between]: [startYearMonth, endYearMonth],
        },
      },
      order: [['yearMonth', 'ASC']],
    });
  }
}

