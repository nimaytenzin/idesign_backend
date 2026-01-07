import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Todo } from './entities/todo.entity';
import { Portfolio } from './entities/portfolio.entity';
import { TodoAssignee } from './entities/todo-assignee.entity';
import { User } from '../auth/entities/user.entity';
import { TodoService } from './services/todo.service';
import { PortfolioService } from './services/portfolio.service';
import { TodoController } from './todo.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([Todo, Portfolio, TodoAssignee, User]),
  ],
  controllers: [TodoController],
  providers: [TodoService, PortfolioService],
  exports: [TodoService, PortfolioService],
})
export class TodoModule {}

