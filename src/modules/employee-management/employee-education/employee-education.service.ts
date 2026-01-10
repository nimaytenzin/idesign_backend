import {
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { EmployeeEducation } from './entities/employee-education.entity';
import { EmployeeProfile } from '../employee-profile/entities/employee-profile.entity';
import { CreateEmployeeEducationDto } from './dto/create-employee-education.dto';
import { UpdateEmployeeEducationDto } from './dto/update-employee-education.dto';

@Injectable()
export class EmployeeEducationService {
  constructor(
    @Inject('EMPLOYEE_EDUCATION_REPOSITORY')
    private readonly educationRepository: typeof EmployeeEducation,
    @Inject('EMPLOYEE_PROFILE_REPOSITORY')
    private readonly employeeProfileRepository: typeof EmployeeProfile,
  ) {}



  // @Post(':userId')
  // create(@Param('userId') userId: string, @Body() createEducationDto: CreateEmployeeEducationDto) {
  //   return this.employeeEducationService.create(+userId, createEducationDto);
  // }
  async create(userId: number, createEducationDto: CreateEmployeeEducationDto) {
    const employeeProfile = await this.employeeProfileRepository.findByPk(userId);
    if (!employeeProfile) {
      throw new NotFoundException('Employee profile not found');
    }
    return this.educationRepository.create({ ...createEducationDto, employeeProfileId: employeeProfile.id });
  }

  // @Get(':userId')
  // findAll(@Param('userId') userId: string) {
  //   return this.employeeEducationService.findAll(+userId);
  // }
  async findAll(userId: number) {
    const employeeProfile = await this.employeeProfileRepository.findByPk(userId);
    if (!employeeProfile) {
      throw new NotFoundException('Employee profile not found');
    }
    return this.educationRepository.findAll({ where: { employeeProfileId: employeeProfile.id } });
  }


  // @Patch(':userId/:id')
  // update(
  //   @Param('userId') userId: string,
  //   @Param('id') id: string,
  //   @Body() updateEducationDto: UpdateEmployeeEducationDto,
  // ) {
  //   return this.employeeEducationService.update(+userId, +id, updateEducationDto);
  // }
  async update(userId: number, id: number, updateEducationDto: UpdateEmployeeEducationDto) {
    const employeeProfile = await this.employeeProfileRepository.findByPk(userId);
    if (!employeeProfile) {
      throw new NotFoundException('Employee profile not found');
    }
    return this.educationRepository.update({ ...updateEducationDto, employeeProfileId: employeeProfile.id }, { where: { id } });
  }

  // @Delete(':userId/:id')
  // remove(@Param('userId') userId: string, @Param('id') id: string) {
  //   return this.employeeEducationService.remove(+userId, +id);
  // }
  async remove(userId: number, id: number) {
    const employeeProfile = await this.employeeProfileRepository.findByPk(userId);
    if (!employeeProfile) {
      throw new NotFoundException('Employee profile not found');
    }
    return this.educationRepository.destroy({ where: { id, employeeProfileId: employeeProfile.id } });
  }
}
