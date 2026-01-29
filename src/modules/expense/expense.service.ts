import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseMonthlyReportResponseDto } from './dto/expense-monthly-report-response.dto';
import { ExpenseDailyStatsResponseDto } from './dto/expense-daily-stats-response.dto';
import { ExpenseYearlyReportResponseDto } from './dto/expense-yearly-report-response.dto';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectModel(Expense)
    private expenseModel: typeof Expense,
  ) {}

  async create(dto: CreateExpenseDto): Promise<Expense> {
    return this.expenseModel.create({
      amount: dto.amount,
      description: dto.description,
      date: new Date(dto.date),
      type: dto.type ?? null,
      subtype: dto.subtype ?? null,
      notes: dto.notes ?? null,
    });
  }

  async findAll(startDate?: string, endDate?: string): Promise<Expense[]> {
    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }
    return this.expenseModel.findAll({
      where,
      order: [['date', 'DESC']],
    });
  }

  /**
   * Returns expenses for a specific calendar month.
   * Dates are inclusive: first day 00:00 through last day 23:59:59.
   */
  async findAllByMonth(year: number, month: number): Promise<Expense[]> {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return this.expenseModel.findAll({
      where: {
        date: {
          [Op.gte]: start,
          [Op.lte]: end,
        },
      },
      order: [['date', 'DESC']],
    });
  }

  /**
   * Monthly report: expenses aggregated by type and subtype for the given month.
   */
  async getExpenseMonthlyReport(
    year: number,
    month: number,
  ): Promise<ExpenseMonthlyReportResponseDto> {
    const expenses = await this.findAllByMonth(year, month);
    const map = new Map<string, { count: number; totalAmount: number }>();

    for (const e of expenses) {
      const type = e.type ?? null;
      const subtype = e.subtype ?? null;
      const key = `${String(type)}::${String(subtype)}`;
      const amount = parseFloat(String(e.amount));
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.totalAmount += amount;
      } else {
        map.set(key, { count: 1, totalAmount: amount });
      }
    }

    const byTypeAndSubtype = Array.from(map.entries()).map(([key, agg]) => {
      const [typeStr, subtypeStr] = key.split('::');
      return {
        type: typeStr === 'null' ? null : typeStr,
        subtype: subtypeStr === 'null' ? null : subtypeStr,
        count: agg.count,
        totalAmount: Math.round(agg.totalAmount * 100) / 100,
      };
    });

    return { year, month, byTypeAndSubtype };
  }

  /**
   * Daily stats: total amount, count, and breakdown by type and subtype for one day.
   */
  async getExpenseDailyStats(
    dateStr: string,
  ): Promise<ExpenseDailyStatsResponseDto> {
    const expenses = await this.expenseModel.findAll({
      where: { date: dateStr },
      attributes: ['amount', 'type', 'subtype'],
    });

    const map = new Map<string, { count: number; totalAmount: number }>();
    let totalAmount = 0;

    for (const e of expenses) {
      const type = e.type ?? null;
      const subtype = e.subtype ?? null;
      const key = `${String(type)}::${String(subtype)}`;
      const amount = parseFloat(String(e.amount));
      totalAmount += amount;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.totalAmount += amount;
      } else {
        map.set(key, { count: 1, totalAmount: amount });
      }
    }

    const byTypeAndSubtype = Array.from(map.entries()).map(([key, agg]) => {
      const [typeStr, subtypeStr] = key.split('::');
      return {
        type: typeStr === 'null' ? null : typeStr,
        subtype: subtypeStr === 'null' ? null : subtypeStr,
        count: agg.count,
        totalAmount: Math.round(agg.totalAmount * 100) / 100,
      };
    });

    return {
      date: dateStr,
      totalAmount: Math.round(totalAmount * 100) / 100,
      count: expenses.length,
      byTypeAndSubtype,
    };
  }

  /**
   * Yearly report: all 12 monthly reports for the given year (expenses by type and subtype).
   */
  async getExpenseYearlyReport(
    year: number,
  ): Promise<ExpenseYearlyReportResponseDto> {
    const monthlyReports = [];
    for (let month = 1; month <= 12; month++) {
      const report = await this.getExpenseMonthlyReport(year, month);
      monthlyReports.push(report);
    }
    return { year, monthlyReports };
  }

  async findOne(id: number): Promise<Expense> {
    const expense = await this.expenseModel.findByPk(id);
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return expense;
  }

  async update(id: number, dto: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.findOne(id);
    await expense.update({
      ...(dto.amount !== undefined && { amount: dto.amount }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.date !== undefined && { date: new Date(dto.date) }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.subtype !== undefined && { subtype: dto.subtype }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const expense = await this.findOne(id);
    await expense.destroy();
  }
}
