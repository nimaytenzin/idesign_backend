import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { AffiliateCommissionResponseDto } from './dto/affiliate-commission-response.dto';
import { AffiliateStatsResponseDto } from './dto/affiliate-stats-response.dto';
import { MonthlyReportResponseDto } from './dto/monthly-report-response.dto';
import { MonthlyReportQueryDto } from './dto/monthly-report-query.dto';
import { CreateAffiliateMarketerDto } from './dto/create-affiliate-marketer.dto';
import { AffiliateMarketerResponseDto } from './dto/affiliate-marketer-response.dto';

@Controller('affiliate')
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  @Post('marketer')
  async createAffiliateMarketer(
    @Body() createDto: CreateAffiliateMarketerDto,
  ) {
    return this.affiliateService.createAffiliateMarketer(createDto);
  }

  @Get('commission')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AFFILIATE_MARKETER)
  async getTotalCommission(
    @Request() req,
  ): Promise<AffiliateCommissionResponseDto> {
    const affiliateId = req.user.id;
    return this.affiliateService.getTotalCommission(affiliateId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AFFILIATE_MARKETER)
  async getStats(@Request() req): Promise<AffiliateStatsResponseDto> {
    const affiliateId = req.user.id;
    return this.affiliateService.getStats(affiliateId);
  }

  @Get('reports/monthly')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AFFILIATE_MARKETER)
  async getMonthlyReport(
    @Request() req,
    @Query() queryDto: MonthlyReportQueryDto,
  ): Promise<MonthlyReportResponseDto> {
    const affiliateId = req.user.id;
    return this.affiliateService.getMonthlyReport(affiliateId, queryDto);
  }
}

@Controller('affiliate-marketer')
export class AffiliateMarketerController {
  constructor(private readonly affiliateService: AffiliateService) {}

  @Post()
  async createAffiliateMarketer(
    @Body() createDto: CreateAffiliateMarketerDto,
  ) {
    return this.affiliateService.createAffiliateMarketer(createDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async getAllAffiliateMarketers(): Promise<AffiliateMarketerResponseDto[]> {
    return this.affiliateService.getAllAffiliateMarketers();
  }
}

