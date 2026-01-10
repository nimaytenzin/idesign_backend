import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AffiliateCommissionService } from './affiliate-commission.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { AffiliateCommissionResponseDto } from './dto/affiliate-commission-response.dto';
import { AffiliateStatsResponseDto } from './dto/affiliate-stats-response.dto';
import { MonthlyReportResponseDto } from './dto/monthly-report-response.dto';
import { MonthlyReportQueryDto } from './dto/monthly-report-query.dto';

@Controller('affiliate')
export class AffiliateCommissionController {
  constructor(private readonly affiliateCommissionService: AffiliateCommissionService) {}

  @Get('commission')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AFFILIATE_MARKETER)
  async getTotalCommission(
    @Request() req,
  ): Promise<AffiliateCommissionResponseDto> {
    const affiliateId = req.user.id;
    return this.affiliateCommissionService.getTotalCommission(affiliateId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AFFILIATE_MARKETER)
  async getStats(@Request() req): Promise<AffiliateStatsResponseDto> {
    const affiliateId = req.user.id;
    return this.affiliateCommissionService.getStats(affiliateId);
  }

  @Get('reports/monthly')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AFFILIATE_MARKETER)
  async getMonthlyReport(
    @Request() req,
    @Query() queryDto: MonthlyReportQueryDto,
  ): Promise<MonthlyReportResponseDto> {
    const affiliateId = req.user.id;
    return this.affiliateCommissionService.getMonthlyReport(affiliateId, queryDto);
  }
}
