import {
  Injectable,
  Inject,
} from '@nestjs/common';
import { EmployeeProfile } from './entities/employee-profile.entity';
import { User, UserRole } from 'src/modules/auth/entities/user.entity';
import { CreateEmployeeProfileDto } from './dto/create-employee-profile.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';
import { Op } from 'sequelize';

@Injectable()
export class EmployeeProfileService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: typeof User,
    @Inject('EMPLOYEE_PROFILE_REPOSITORY')
    private readonly employeeProfileRepository: typeof EmployeeProfile,
  ) {}


  async createEmployeeProfile(data: CreateEmployeeProfileDto) {
    return this.employeeProfileRepository.create(data);
  }


  async update(id: number, data: UpdateEmployeeProfileDto) {
    return this.employeeProfileRepository.update(data, { where: { id } });
  }

  /**
   * Get all staff with their employee profiles for public display
   * Returns only: name, department, position, and bio
   */
  async getPublicStaffList() {
    return await this.userRepository.findAll({
      where: {
        role: UserRole.STAFF,
        isActive: true,
      },
      attributes: ['id', 'name', 'profileImageUrl'],
      include: [
        {
          model: EmployeeProfile,
          attributes: ['department', 'position', 'bio'],
        },
      ],
    });
  }

}
