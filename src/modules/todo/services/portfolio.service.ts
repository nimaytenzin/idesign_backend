import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Portfolio } from '../entities/portfolio.entity';
import { CreatePortfolioDto } from '../dto/create-portfolio.dto';
import { UpdatePortfolioDto } from '../dto/update-portfolio.dto';
import { PortfolioResponseDto } from '../dto/portfolio-response.dto';
import { Todo } from '../entities/todo.entity';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectModel(Portfolio)
    private portfolioModel: typeof Portfolio,
  ) {}

  async create(createDto: CreatePortfolioDto): Promise<Portfolio> {
    // Check if portfolio with same name already exists
    const existingPortfolio = await this.portfolioModel.findOne({
      where: { name: createDto.name },
    });

    if (existingPortfolio) {
      throw new ConflictException(`Portfolio with name "${createDto.name}" already exists`);
    }

    return this.portfolioModel.create({
      name: createDto.name,
    });
  }

  async findAll(): Promise<Portfolio[]> {
    return this.portfolioModel.findAll({
      include: [
        {
          model: Todo,
          as: 'todos',
          required: false,
        },
      ],
      order: [['name', 'ASC']],
    });
  }

  async findOne(id: number): Promise<Portfolio> {
    const portfolio = await this.portfolioModel.findByPk(id, {
      include: [
        {
          model: Todo,
          as: 'todos',
          required: false,
        },
      ],
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${id} not found`);
    }

    return portfolio;
  }

  async update(id: number, updateDto: UpdatePortfolioDto): Promise<Portfolio> {
    const portfolio = await this.findOne(id);

    // Check if name is being updated and if it conflicts with existing portfolio
    if (updateDto.name && updateDto.name !== portfolio.name) {
      const existingPortfolio = await this.portfolioModel.findOne({
        where: { name: updateDto.name },
      });

      if (existingPortfolio) {
        throw new ConflictException(`Portfolio with name "${updateDto.name}" already exists`);
      }
    }

    await portfolio.update({
      name: updateDto.name ?? portfolio.name,
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const portfolio = await this.findOne(id);
    await portfolio.destroy();
  }

  mapToResponse(portfolio: Portfolio): PortfolioResponseDto {
    const response: PortfolioResponseDto = {
      id: portfolio.id,
      name: portfolio.name,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
    };

    if (portfolio.todos) {
      response.todosCount = portfolio.todos.length;
    }

    return response;
  }
}

