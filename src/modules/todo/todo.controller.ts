import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { TodoService } from './services/todo.service';
import { PortfolioService } from './services/portfolio.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { PortfolioResponseDto } from './dto/portfolio-response.dto';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoQueryDto } from './dto/todo-query.dto';
import { TodoResponseDto } from './dto/todo-response.dto';
import { MarkCompleteDto } from './dto/mark-complete.dto';
import { TodoStatus } from './entities/todo.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('todos')
export class TodoController {
  constructor(
    private readonly todoService: TodoService,
    private readonly portfolioService: PortfolioService,
  ) {}

  // Portfolio endpoints
  @Post('portfolios')
  @HttpCode(HttpStatus.CREATED)
  async createPortfolio(
    @Body() createPortfolioDto: CreatePortfolioDto,
  ): Promise<PortfolioResponseDto> {
    const portfolio = await this.portfolioService.create(createPortfolioDto);
    return this.portfolioService.mapToResponse(portfolio);
  }

  @Get('portfolios')
  async findAllPortfolios(): Promise<PortfolioResponseDto[]> {
    const portfolios = await this.portfolioService.findAll();
    return portfolios.map((portfolio) => this.portfolioService.mapToResponse(portfolio));
  }

  @Get('portfolios/:id')
  async findOnePortfolio(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PortfolioResponseDto> {
    const portfolio = await this.portfolioService.findOne(id);
    return this.portfolioService.mapToResponse(portfolio);
  }

  @Patch('portfolios/:id')
  async updatePortfolio(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePortfolioDto: UpdatePortfolioDto,
  ): Promise<PortfolioResponseDto> {
    const portfolio = await this.portfolioService.update(id, updatePortfolioDto);
    return this.portfolioService.mapToResponse(portfolio);
  }

  @Delete('portfolios/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePortfolio(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.portfolioService.remove(id);
  }

  // Todo endpoints
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createTodoDto: CreateTodoDto,
    @Request() req,
  ): Promise<TodoResponseDto> {
    const todo = await this.todoService.create(createTodoDto,1);
    return this.todoService.mapToResponse(todo);
  }

  @Get()
  async findAll(@Query() queryDto: TodoQueryDto): Promise<TodoResponseDto[]> {
    const todos = await this.todoService.findAll(queryDto);
    return todos.map((todo) => this.todoService.mapToResponse(todo));
  }

  // Staff endpoints
  @Get('my-todos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF)
  async getMyTodos(@Request() req): Promise<TodoResponseDto[]> {
    const queryDto: TodoQueryDto = { 
      assignedUserId: req.user.id,
      status: TodoStatus.PENDING 
    };
    const todos = await this.todoService.findAll(queryDto);
    return todos.map((todo) => this.todoService.mapToResponse(todo));
  }

  @Get('my-todos/completed-this-week')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF)
  async getMyCompletedTodosThisWeek(@Request() req): Promise<TodoResponseDto[]> {
    const todos = await this.todoService.findCompletedThisWeekByUser(req.user.id);
    return todos.map((todo) => this.todoService.mapToResponse(todo));
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF)
  async getAllTodos(@Query() queryDto: TodoQueryDto): Promise<TodoResponseDto[]> {
    const queryWithPending: TodoQueryDto = {
      ...queryDto,
      status: TodoStatus.PENDING,
    };
    const todos = await this.todoService.findAll(queryWithPending);
    return todos.map((todo) => this.todoService.mapToResponse(todo));
  }

  @Get('day/:date')
  async getDayView(@Param('date') date: string): Promise<TodoResponseDto[]> {
    const todos = await this.todoService.getDayView(date);
    return todos.map((todo) => this.todoService.mapToResponse(todo));
  }

  @Get('week/:startDate')
  async getWeekView(@Param('startDate') startDate: string): Promise<Record<string, TodoResponseDto[]>> {
    const groupedTodos = await this.todoService.getWeekView(startDate);
    const result: Record<string, TodoResponseDto[]> = {};
    
    Object.keys(groupedTodos).forEach((day) => {
      result[day] = groupedTodos[day].map((todo) => this.todoService.mapToResponse(todo));
    });
    
    return result;
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<TodoResponseDto> {
    const todo = await this.todoService.findOne(id);
    return this.todoService.mapToResponse(todo);
  }

  @Patch(':id/mark-complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async markAsComplete(
    @Param('id', ParseIntPipe) id: number,
    @Body() markCompleteDto: MarkCompleteDto,
  ): Promise<TodoResponseDto> {
    const todo = await this.todoService.markAsComplete(id, markCompleteDto.remarks);
    return this.todoService.mapToResponse(todo);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTodoDto: UpdateTodoDto,
  ): Promise<TodoResponseDto> {
    const todo = await this.todoService.update(id, updateTodoDto);
    return this.todoService.mapToResponse(todo);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.todoService.remove(id);
  }
}

