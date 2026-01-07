import {
  Controller,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { GeneralLedgerQueryDto } from './dto/general-ledger-query.dto';
import { GeneralLedgerResponseDto } from './dto/general-ledger-response.dto';
import { ProfitLossQueryDto } from './dto/profit-loss-query.dto';
import { ProfitLossResponseDto } from './dto/profit-loss-response.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  // General Ledger Endpoints
  @Get('reports/general-ledger')
  async getGeneralLedger(
    @Query() query: GeneralLedgerQueryDto,
  ): Promise<GeneralLedgerResponseDto> {
    return this.accountsService.getGeneralLedger(query);
  }

  @Get('reports/general-ledger/by-month')
  async getGeneralLedgerByMonth(
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('accountCode') accountCode?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ): Promise<GeneralLedgerResponseDto> {
    // Parse and validate query parameters
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);

    if (isNaN(yearNum) || isNaN(monthNum)) {
      throw new BadRequestException('Year and month must be valid numbers');
    }

    if (yearNum < 1900 || yearNum > 2100) {
      throw new BadRequestException('Year must be between 1900 and 2100');
    }

    if (monthNum < 1 || monthNum > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }

    const query: GeneralLedgerQueryDto = {
      year: yearNum,
      month: monthNum,
      accountCode,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    };

    return this.accountsService.getGeneralLedger(query);
  }

  // Profit & Loss (Income Statement) Endpoints
  @Get('reports/profit-loss')
  async getProfitLossStatement(
    @Query() query: ProfitLossQueryDto,
  ): Promise<ProfitLossResponseDto> {
    return this.accountsService.getProfitLossStatement(query);
  }

  @Get('reports/profit-loss/by-month')
  async getProfitLossByMonth(
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('format') format?: 'summary' | 'detailed',
  ): Promise<ProfitLossResponseDto> {
    // Parse and validate query parameters
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);

    if (isNaN(yearNum) || isNaN(monthNum)) {
      throw new BadRequestException('Year and month must be valid numbers');
    }

    if (yearNum < 1900 || yearNum > 2100) {
      throw new BadRequestException('Year must be between 1900 and 2100');
    }

    if (monthNum < 1 || monthNum > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }

    const query: ProfitLossQueryDto = {
      year: yearNum,
      month: monthNum,
      format: format || 'detailed',
    };

    return this.accountsService.getProfitLossStatement(query);
  }
}
