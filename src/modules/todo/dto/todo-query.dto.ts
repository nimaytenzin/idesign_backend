import { IsNumber, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { TodoStatus } from '../entities/todo.entity';

export enum TodoViewType {
  DAY = 'day',
  WEEK = 'week',
  LIST = 'list',
}

export class TodoQueryDto {
  @IsNumber()
  @IsOptional()
  portfolioId?: number;

  @IsEnum(TodoStatus)
  @IsOptional()
  status?: TodoStatus;

  @IsNumber()
  @IsOptional()
  assignedUserId?: number;

  @IsEnum(TodoViewType)
  @IsOptional()
  view?: TodoViewType;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

