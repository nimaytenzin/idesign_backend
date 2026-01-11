import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { Attendance } from './entities/attendance.entity';
import { User } from '../auth/entities/user.entity';
import { CompanyModule } from '../company/company-profile/company.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Attendance, User]),
    CompanyModule,
    AuthModule,
  ],
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
    {
      provide: 'ATTENDANCE_REPOSITORY',
      useValue: Attendance,
    },
    {
      provide: 'USER_REPOSITORY',
      useValue: User,
    },
  ],
  exports: [AttendanceService],
})
export class AttendanceModule {}
