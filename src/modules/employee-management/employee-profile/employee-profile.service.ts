import {
  Injectable,
  Inject,
  NotFoundException,
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

  /**
   * Get employee profile by user ID
   * @param userId - The user ID to get employee profile for
   * @returns Employee profile with user information
   */
  async getEmployeeProfileByUserId(userId: number) {
    const employeeProfile = await this.employeeProfileRepository.findOne({
      where: { userId },
      include: [
        {
          model: User,
          attributes: [
            'id',
            'name',
            'emailAddress',
            'phoneNumber',
            'currentAddress',
            'permanentAddress',
            'dateOfBirth',
            'profileImageUrl',
            'role',
            'isActive',
          ],
        },
      ],
    });

    if (!employeeProfile) {
      throw new NotFoundException(
        `Employee profile not found for user with ID ${userId}`,
      );
    }

    return employeeProfile;
  }
}
