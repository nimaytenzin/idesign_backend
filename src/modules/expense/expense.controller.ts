import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { ExpenseByMonthQueryDto } from './dto/expense-by-month-query.dto';
import { ExpenseMonthlyReportResponseDto } from './dto/expense-monthly-report-response.dto';
import { ExpenseDailyStatsQueryDto } from './dto/expense-daily-stats-query.dto';
import { ExpenseDailyStatsResponseDto } from './dto/expense-daily-stats-response.dto';
import { ExpenseYearlyReportResponseDto } from './dto/expense-yearly-report-response.dto';
import { YearQueryDto } from './dto/year-query.dto';
import { Expense } from './entities/expense.entity';

@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  create(@Body() createExpenseDto: CreateExpenseDto): Promise<Expense> {
    return this.expenseService.create(createExpenseDto);
  }

  @Get()
  findAll(@Query() query: ExpenseQueryDto): Promise<Expense[]> {
    return this.expenseService.findAll(query.startDate, query.endDate);
  }

  @Get('by-month')
  findAllByMonth(@Query() query: ExpenseByMonthQueryDto): Promise<Expense[]> {
    return this.expenseService.findAllByMonth(query.year, query.month);
  }

  /**
   * Monthly report: expenses aggregated by type and subtype.
   * @route GET /expenses/monthly-report?year=&month=
   */
  @Get('monthly-report')
  getExpenseMonthlyReport(
    @Query() query: ExpenseByMonthQueryDto,
  ): Promise<ExpenseMonthlyReportResponseDto> {
    return this.expenseService.getExpenseMonthlyReport(query.year, query.month);
  }

  /**
   * Daily stats: total amount, count, and breakdown by type and subtype for one day.
   * @route GET /expenses/daily-stats?date=YYYY-MM-DD
   */
  @Get('daily-stats')
  getExpenseDailyStats(
    @Query() query: ExpenseDailyStatsQueryDto,
  ): Promise<ExpenseDailyStatsResponseDto> {
    return this.expenseService.getExpenseDailyStats(query.date);
  }

  /**
   * Yearly report: all 12 monthly reports for the selected year (expenses by type and subtype).
   * @route GET /expenses/yearly-report?year=YYYY
   */
  @Get('yearly-report')
  getExpenseYearlyReport(
    @Query() query: YearQueryDto,
  ): Promise<ExpenseYearlyReportResponseDto> {
    return this.expenseService.getExpenseYearlyReport(query.year);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Expense> {
    return this.expenseService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ): Promise<Expense> {
    return this.expenseService.update(+id, updateExpenseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.expenseService.remove(+id);
  }
}
