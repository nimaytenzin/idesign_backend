import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { EmployeeEducationService } from './employee-education.service';
import { EmployeeEducationController } from './employee-education.controller';
import { EmployeeEducation } from './entities/employee-education.entity';
import { EmployeeProfile } from '../employee-profile/entities/employee-profile.entity';
import { EmployeeProfileModule } from '../employee-profile/employee-profile.module';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [
    SequelizeModule.forFeature([EmployeeEducation, EmployeeProfile]),
    EmployeeProfileModule,
    AuthModule,
  ],
  controllers: [EmployeeEducationController],
  providers: [
    EmployeeEducationService,
    {
      provide: 'EMPLOYEE_EDUCATION_REPOSITORY',
      useValue: EmployeeEducation,
    },
    {
      provide: 'EMPLOYEE_PROFILE_REPOSITORY',
      useValue: EmployeeProfile,
    },
  ],
  exports: [EmployeeEducationService],
})
export class EmployeeEducationModule {}
