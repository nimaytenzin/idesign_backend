import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { EmployeeWorkExperienceService } from './employee-work-experience.service';
import { EmployeeWorkExperienceController } from './employee-work-experience.controller';
import { EmployeeWorkExperience } from './entities/employee-work-experience.entity';
import { EmployeeProfile } from '../employee-profile/entities/employee-profile.entity';
import { EmployeeProfileModule } from '../employee-profile/employee-profile.module';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [
    SequelizeModule.forFeature([EmployeeWorkExperience, EmployeeProfile]),
    EmployeeProfileModule,
    AuthModule,
  ],
  controllers: [EmployeeWorkExperienceController],
  providers: [
    EmployeeWorkExperienceService,
    {
      provide: 'EMPLOYEE_WORK_EXPERIENCE_REPOSITORY',
      useValue: EmployeeWorkExperience,
    },
    {
      provide: 'EMPLOYEE_PROFILE_REPOSITORY',
      useValue: EmployeeProfile,
    },
  ],
  exports: [EmployeeWorkExperienceService],
})
export class EmployeeWorkExperienceModule {}
