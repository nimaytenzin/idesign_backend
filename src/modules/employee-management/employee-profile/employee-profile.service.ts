import {
  Injectable,
  Inject,
} from '@nestjs/common';
import { EmployeeProfile } from './entities/employee-profile.entity';
import { User } from 'src/modules/auth/entities/user.entity';
import { CreateEmployeeProfileDto } from './dto/create-employee-profile.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';

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


}
