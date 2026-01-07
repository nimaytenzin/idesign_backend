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
import { Expense } from './entities/expense.entity';

@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  async create(@Body() createExpenseDto: CreateExpenseDto): Promise<Expense> {
    return this.expenseService.create(createExpenseDto);
  }

  @Get()
  async findAll(@Query() query: ExpenseQueryDto): Promise<Expense[]> {
    return this.expenseService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Expense> {
    return this.expenseService.findOne(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ): Promise<Expense> {
    return this.expenseService.update(+id, updateExpenseDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.expenseService.remove(+id);
  }

  @Post(':id/post')
  async postToLedger(@Param('id') id: string): Promise<Expense> {
    return this.expenseService.postToLedger(+id);
  }
}

