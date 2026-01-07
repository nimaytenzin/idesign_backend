import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { EmployeeManagementService } from './employee-management.service';
import { EmployeeManagementController } from './employee-management.controller';
import { User } from '../auth/entities/user.entity';
import { EmployeeEducation } from './entities/employee-education.entity';
import { EmployeeWorkExperience } from './entities/employee-work-experience.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    SequelizeModule.forFeature([
      User,
      EmployeeEducation,
      EmployeeWorkExperience,
    ]),
  ],
  controllers: [EmployeeManagementController],
  providers: [
    EmployeeManagementService,
    {
      provide: 'USER_REPOSITORY',
      useValue: User,
    },
    {
      provide: 'EMPLOYEE_EDUCATION_REPOSITORY',
      useValue: EmployeeEducation,
    },
    {
      provide: 'EMPLOYEE_WORK_EXPERIENCE_REPOSITORY',
      useValue: EmployeeWorkExperience,
    },
  ],
  exports: [EmployeeManagementService],
})
export class EmployeeManagementModule {}

