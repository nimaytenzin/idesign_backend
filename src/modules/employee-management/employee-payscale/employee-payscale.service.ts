import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { EmployeePayscale } from './entities/employee-payscale.entity';
import { User } from 'src/modules/auth/entities/user.entity';
import { CreateEmployeePayscaleDto } from './dto/create-employee-payscale.dto';
import { UpdateEmployeePayscaleDto } from './dto/update-employee-payscale.dto';

@Injectable()
export class EmployeePayscaleService {
  constructor(
    @Inject('EMPLOYEE_PAYSCALE_REPOSITORY')
    private readonly employeePayscaleRepository: typeof EmployeePayscale,
    @Inject('USER_REPOSITORY')
    private readonly userRepository: typeof User,
  ) {}

  /**
   * Get payscale by user ID
   * @param userId - The user ID to get payscale for
   * @returns Employee payscale with user information
   */
  async getPayscaleByUserId(userId: number) {
    const payscale = await this.employeePayscaleRepository.findOne({
      where: { userId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'emailAddress'],
        },
      ],
    });

    if (!payscale) {
      throw new NotFoundException(`Payscale not found for user with ID ${userId}`);
    }

    return payscale;
  }

  /**
   * Create a new payscale for a user
   * @param data - Payscale data
   * @returns Created payscale
   */
  async createPayscale(data: CreateEmployeePayscaleDto) {
    // Check if user exists
    const user = await this.userRepository.findByPk(data.userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${data.userId} not found`);
    }

    // Check if payscale already exists for this user
    const existingPayscale = await this.employeePayscaleRepository.findOne({
      where: { userId: data.userId },
    });

    if (existingPayscale) {
      throw new Error(`Payscale already exists for user with ID ${data.userId}`);
    }

    return this.employeePayscaleRepository.create(data);
  }

  /**
   * Update payscale for a user (admin only)
   * @param userId - The user ID whose payscale to update
   * @param data - Updated payscale data
   * @returns Updated payscale
   */
  async updatePayscale(userId: number, data: UpdateEmployeePayscaleDto) {
    const payscale = await this.employeePayscaleRepository.findOne({
      where: { userId },
    });

    if (!payscale) {
      throw new NotFoundException(`Payscale not found for user with ID ${userId}`);
    }

    await this.employeePayscaleRepository.update(data, {
      where: { userId },
    });

    return this.getPayscaleByUserId(userId);
  }
}
