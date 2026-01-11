import {
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { EmployeeWorkExperience } from './entities/employee-work-experience.entity';
import { EmployeeProfile } from '../employee-profile/entities/employee-profile.entity';
import { CreateEmployeeWorkExperienceDto } from './dto/create-employee-work-experience.dto';
import { UpdateEmployeeWorkExperienceDto } from './dto/update-employee-work-experience.dto';

@Injectable()
export class EmployeeWorkExperienceService {
  constructor(
    @Inject('EMPLOYEE_WORK_EXPERIENCE_REPOSITORY')
    private readonly workExperienceRepository: typeof EmployeeWorkExperience,
    @Inject('EMPLOYEE_PROFILE_REPOSITORY')
    private readonly employeeProfileRepository: typeof EmployeeProfile,
  ) {}
 
  async create(userId: number, createWorkExperienceDto: CreateEmployeeWorkExperienceDto) {
    const employeeProfile = await this.employeeProfileRepository.findOne({ where: { userId } });
    if (!employeeProfile) {
      throw new NotFoundException('Employee profile not found');
    }
    return this.workExperienceRepository.create({ ...createWorkExperienceDto, employeeProfileId: employeeProfile.id });
  }
 
  async findAllByUserId(userId: number) {
    const employeeProfile = await this.employeeProfileRepository.findOne({ where: { userId } });
    return this.workExperienceRepository.findAll({ where: { employeeProfileId: employeeProfile?.id } });
  }

  
  async update(userId: number, id: number, updateWorkExperienceDto: UpdateEmployeeWorkExperienceDto) {
    const employeeProfile = await this.employeeProfileRepository.findOne({ where: { userId } });
    if (!employeeProfile) {
      throw new NotFoundException('Employee profile not found');
    }
    return this.workExperienceRepository.update({ ...updateWorkExperienceDto, employeeProfileId: employeeProfile.id }, { where: { id } });
  }
 

  async remove(userId: number, id: number) {
    const employeeProfile = await this.employeeProfileRepository.findOne({ where: { userId } });
    if (!employeeProfile) {
      throw new NotFoundException('Employee profile not found');
    }
    return this.workExperienceRepository.destroy({ where: { id, employeeProfileId: employeeProfile.id } });
  }
}
