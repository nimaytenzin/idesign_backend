import {
  IsString,
  IsNumber,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  ArrayMinSize,
} from 'class-validator';
import { TodoStatus } from '../entities/todo.entity';

export class UpdateTodoDto {
  @IsString()
  @IsOptional()
  task?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  portfolioId?: number;

  @IsArray()
  @IsOptional()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  assignedUserIds?: number[];

  @IsDateString()
  @IsOptional()
  assignedDate?: string;

  @IsDateString()
  @IsOptional()
  dueBy?: string;

  @IsEnum(TodoStatus)
  @IsOptional()
  status?: TodoStatus;

  @IsString()
  @IsOptional()
  remarks?: string;
}

