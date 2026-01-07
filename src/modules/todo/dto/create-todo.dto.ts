import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  ArrayMinSize,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TodoStatus } from '../entities/todo.entity';

export class CreateTodoDto {
  @IsString()
  @IsNotEmpty()
  task: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Transform(({ value }) => {
    if (typeof value === 'number') return value;
    return parseInt(value, 10);
  })
  @IsNumber()
  @IsNotEmpty()
  portfolioId: number;

  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => (typeof v === 'number' ? v : parseInt(v, 10)));
    }
    return [typeof value === 'number' ? value : parseInt(value, 10)];
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  assignedUserIds: number[];

  @IsDateString()
  @IsOptional()
  assignedDate?: string;

  @IsDateString()
  @IsOptional()
  dueBy?: string;

  @IsEnum(TodoStatus)
  @IsOptional()
  status?: TodoStatus;
}

