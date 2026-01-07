import { TodoStatus } from '../entities/todo.entity';

export class TodoResponseDto {
  id: number;
  task: string;
  description: string | null;
  status: TodoStatus;
  assignedDate: Date;
  dueBy: Date | null;
  portfolioId: number;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
  portfolio?: {
    id: number;
    name: string;
  };
  createdBy?: {
    id: number;
    name: string;
    emailAddress: string;
  };
  assignedUsers?: Array<{
    id: number;
    name: string;
    emailAddress: string;
  }>;
}

