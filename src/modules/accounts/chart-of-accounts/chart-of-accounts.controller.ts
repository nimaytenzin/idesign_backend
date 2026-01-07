import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { CreateChartOfAccountsDto } from './dto/create-chart-of-accounts.dto';
import { UpdateChartOfAccountsDto } from './dto/update-chart-of-accounts.dto';
import { ChartOfAccounts } from './entities/chart-of-accounts.entity';

@Controller('chart-of-accounts')
export class ChartOfAccountsController {
  constructor(
    private readonly chartOfAccountsService: ChartOfAccountsService,
  ) {}

  @Post()
  async create(
    @Body() createChartOfAccountsDto: CreateChartOfAccountsDto,
  ): Promise<ChartOfAccounts> {
    return this.chartOfAccountsService.create(createChartOfAccountsDto);
  }

  @Get()
  async findAll(): Promise<ChartOfAccounts[]> {
    return this.chartOfAccountsService.findAll();
  }

  @Get(':accountCode')
  async findOne(@Param('accountCode') accountCode: string): Promise<ChartOfAccounts> {
    return this.chartOfAccountsService.findOne(accountCode);
  }

  @Patch(':accountCode')
  async update(
    @Param('accountCode') accountCode: string,
    @Body() updateChartOfAccountsDto: UpdateChartOfAccountsDto,
  ): Promise<ChartOfAccounts> {
    return this.chartOfAccountsService.update(accountCode, updateChartOfAccountsDto);
  }

  @Delete(':accountCode')
  async remove(@Param('accountCode') accountCode: string): Promise<void> {
    return this.chartOfAccountsService.remove(accountCode);
  }
}

