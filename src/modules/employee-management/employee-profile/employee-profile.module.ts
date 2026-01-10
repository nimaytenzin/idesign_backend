import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { EmployeeProfileService } from './employee-profile.service';
import { EmployeeProfileController } from './employee-profile.controller';
import { EmployeeProfile } from './entities/employee-profile.entity';
import { AuthModule } from 'src/modules/auth/auth.module';
import { User } from 'src/modules/auth/entities/user.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([EmployeeProfile, User]),
    AuthModule,
  ],
  controllers: [EmployeeProfileController],
  providers: [
    EmployeeProfileService,
    {
      provide: 'USER_REPOSITORY',
      useValue: User,
    },
    {
      provide: 'EMPLOYEE_PROFILE_REPOSITORY',
      useValue: EmployeeProfile,
    },
  ],
  exports: [EmployeeProfileService],
})
export class EmployeeProfileModule {}
