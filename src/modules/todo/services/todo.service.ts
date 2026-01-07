import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Todo, TodoStatus } from '../entities/todo.entity';
import { Portfolio } from '../entities/portfolio.entity';
import { User } from '../../auth/entities/user.entity';
import { TodoAssignee } from '../entities/todo-assignee.entity';
import { CreateTodoDto } from '../dto/create-todo.dto';
import { UpdateTodoDto } from '../dto/update-todo.dto';
import { TodoQueryDto } from '../dto/todo-query.dto';
import { TodoResponseDto } from '../dto/todo-response.dto';

@Injectable()
export class TodoService {
  constructor(
    @InjectModel(Todo)
    private todoModel: typeof Todo,
    @InjectModel(Portfolio)
    private portfolioModel: typeof Portfolio,
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(TodoAssignee)
    private todoAssigneeModel: typeof TodoAssignee,
  ) {}

  async create(createDto: CreateTodoDto, createdById: number): Promise<Todo> {
    // Validate portfolio exists
    const portfolio = await this.portfolioModel.findByPk(createDto.portfolioId);
    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${createDto.portfolioId} not found`);
    }

    // Validate all assigned users exist
    const users = await this.userModel.findAll({
      where: {
        id: {
          [Op.in]: createDto.assignedUserIds,
        },
      },
    });

    if (users.length !== createDto.assignedUserIds.length) {
      throw new NotFoundException('One or more assigned users not found');
    }

    // Create todo
    const assignedDate = createDto.assignedDate ? new Date(createDto.assignedDate) : new Date();
    const dueBy = createDto.dueBy ? new Date(createDto.dueBy) : null;

    const todo = await this.todoModel.create({
      task: createDto.task,
      description: createDto.description ?? null,
      portfolioId: createDto.portfolioId,
      createdById,
      assignedDate,
      dueBy,
      status: createDto.status ?? TodoStatus.PENDING,
    });

    // Create assignee relationships
    try {
      await Promise.all(
        createDto.assignedUserIds.map((userId) =>
          this.todoAssigneeModel.create({
            todoId: todo.id,
            userId,
          }),
        ),
      );
    } catch (error) {
      // If assignee creation fails, delete the todo and rethrow
      await todo.destroy();
      throw new BadRequestException(
        `Failed to assign users to todo: ${error.message}`,
      );
    }

    // Reload todo with all relationships
    return this.findOne(todo.id);
  }

  async findAll(queryDto?: TodoQueryDto): Promise<Todo[]> {
    const where: any = {};

    if (queryDto?.portfolioId) {
      where.portfolioId = queryDto.portfolioId;
    }

    if (queryDto?.status) {
      where.status = queryDto.status;
    }

    // Date range filtering
    if (queryDto?.startDate && queryDto?.endDate) {
      const startDate = new Date(queryDto.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(queryDto.endDate);
      endDate.setHours(23, 59, 59, 999);

      where[Op.or] = [
        {
          assignedDate: {
            [Op.between]: [startDate, endDate],
          },
        },
        {
          dueBy: {
            [Op.between]: [startDate, endDate],
          },
        },
      ];
    }

    // Build include for assignedUsers with optional filtering
    const assignedUsersInclude: any = {
      model: User,
      as: 'assignedUsers',
      attributes: ['id', 'name', 'emailAddress'],
      through: {
        attributes: ['assignedAt'],
      },
    };

    if (queryDto?.assignedUserId) {
      assignedUsersInclude.where = { id: queryDto.assignedUserId };
      assignedUsersInclude.required = true; // Use INNER JOIN to filter
    }

    return this.todoModel.findAll({
      where,
      include: [
        {
          model: Portfolio,
          as: 'portfolio',
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'emailAddress'],
        },
        assignedUsersInclude,
      ],
      order: [['assignedDate', 'ASC']],
    });
  }

  async findOne(id: number): Promise<Todo> {
    const todo = await this.todoModel.findByPk(id, {
      include: [
        {
          model: Portfolio,
          as: 'portfolio',
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'emailAddress'],
        },
        {
          model: User,
          as: 'assignedUsers',
          attributes: ['id', 'name', 'emailAddress'],
          through: {
            attributes: ['assignedAt'],
          },
        },
      ],
    });

    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    return todo;
  }

  async update(id: number, updateDto: UpdateTodoDto): Promise<Todo> {
    const todo = await this.findOne(id);

    // Validate portfolio if provided
    if (updateDto.portfolioId) {
      const portfolio = await this.portfolioModel.findByPk(updateDto.portfolioId);
      if (!portfolio) {
        throw new NotFoundException(`Portfolio with ID ${updateDto.portfolioId} not found`);
      }
    }

    // Validate assigned users if provided
    if (updateDto.assignedUserIds && updateDto.assignedUserIds.length > 0) {
      const users = await this.userModel.findAll({
        where: {
          id: {
            [Op.in]: updateDto.assignedUserIds,
          },
        },
      });

      if (users.length !== updateDto.assignedUserIds.length) {
        throw new NotFoundException('One or more assigned users not found');
      }
    }

    // Update todo fields
    const updateData: any = {};

    if (updateDto.task !== undefined) updateData.task = updateDto.task;
    if (updateDto.description !== undefined) updateData.description = updateDto.description;
    if (updateDto.portfolioId !== undefined) updateData.portfolioId = updateDto.portfolioId;
    if (updateDto.assignedDate !== undefined)
      updateData.assignedDate = new Date(updateDto.assignedDate);
    if (updateDto.dueBy !== undefined) updateData.dueBy = updateDto.dueBy ? new Date(updateDto.dueBy) : null;
    if (updateDto.status !== undefined) updateData.status = updateDto.status;

    await todo.update(updateData);

    // Update assigned users if provided
    if (updateDto.assignedUserIds) {
      // Remove existing assignees
      await this.todoAssigneeModel.destroy({
        where: { todoId: id },
      });

      // Create new assignees
      await Promise.all(
        updateDto.assignedUserIds.map((userId) =>
          this.todoAssigneeModel.create({
            todoId: id,
            userId,
          }),
        ),
      );
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const todo = await this.findOne(id);

    // Remove assignees first
    await this.todoAssigneeModel.destroy({
      where: { todoId: id },
    });

    // Remove todo
    await todo.destroy();
  }

  async getDayView(date: string): Promise<Todo[]> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return this.todoModel.findAll({
      where: {
        [Op.or]: [
          {
            assignedDate: {
              [Op.gte]: targetDate,
              [Op.lt]: nextDay,
            },
          },
          {
            dueBy: {
              [Op.gte]: targetDate,
              [Op.lt]: nextDay,
            },
          },
        ],
      },
      include: [
        {
          model: Portfolio,
          as: 'portfolio',
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'emailAddress'],
        },
        {
          model: User,
          as: 'assignedUsers',
          attributes: ['id', 'name', 'emailAddress'],
          through: {
            attributes: ['assignedAt'],
          },
        },
      ],
      order: [['assignedDate', 'ASC']],
    });
  }

  async getWeekView(startDate: string): Promise<Record<string, Todo[]>> {
    const weekStart = new Date(startDate);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const todos = await this.todoModel.findAll({
      where: {
        [Op.or]: [
          {
            assignedDate: {
              [Op.gte]: weekStart,
              [Op.lt]: weekEnd,
            },
          },
          {
            dueBy: {
              [Op.gte]: weekStart,
              [Op.lt]: weekEnd,
            },
          },
        ],
      },
      include: [
        {
          model: Portfolio,
          as: 'portfolio',
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'emailAddress'],
        },
        {
          model: User,
          as: 'assignedUsers',
          attributes: ['id', 'name', 'emailAddress'],
          through: {
            attributes: ['assignedAt'],
          },
        },
      ],
      order: [['assignedDate', 'ASC']],
    });

    // Group todos by day of week
    const grouped: Record<string, Todo[]> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    todos.forEach((todo) => {
      // Use assignedDate for grouping, fallback to dueBy if assignedDate is not in range
      let dateToUse = new Date(todo.assignedDate);
      if (dateToUse < weekStart || dateToUse >= weekEnd) {
        if (todo.dueBy) {
          dateToUse = new Date(todo.dueBy);
        }
      }

      if (dateToUse >= weekStart && dateToUse < weekEnd) {
        const dayIndex = dateToUse.getDay();
        const dayName = dayNames[dayIndex];
        if (grouped[dayName]) {
          grouped[dayName].push(todo);
        }
      }
    });

    return grouped;
  }

  mapToResponse(todo: Todo): TodoResponseDto {
    const response: TodoResponseDto = {
      id: todo.id,
      task: todo.task,
      description: todo.description,
      status: todo.status,
      assignedDate: todo.assignedDate,
      dueBy: todo.dueBy,
      portfolioId: todo.portfolioId,
      createdById: todo.createdById,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    };

    if (todo.portfolio) {
      response.portfolio = {
        id: todo.portfolio.id,
        name: todo.portfolio.name,
      };
    }

    if (todo.createdBy) {
      response.createdBy = {
        id: todo.createdBy.id,
        name: todo.createdBy.name,
        emailAddress: todo.createdBy.emailAddress,
      };
    }

    if (todo.assignedUsers) {
      response.assignedUsers = todo.assignedUsers.map((user) => ({
        id: user.id,
        name: user.name,
        emailAddress: user.emailAddress,
      }));
    }

    return response;
  }
}

