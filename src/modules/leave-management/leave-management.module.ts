import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LeaveTypeService } from './leave-type.service';
import { LeaveTypeController } from './leave-type.controller';
import { LeaveRequestService } from './leave-request.service';
import { LeaveRequestController } from './leave-request.controller';
import { LeaveBalanceService } from './leave-balance.service';
import { LeaveBalanceController } from './leave-balance.controller';
import { LeaveType } from './entities/leave-type.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { LeaveBalance } from './entities/leave-balance.entity';
import { User } from '../auth/entities/user.entity';
import { EmployeeProfile } from '../employee-management/employee-profile/entities/employee-profile.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([LeaveType, LeaveRequest, LeaveBalance, User, EmployeeProfile]),
  ],
  providers: [
    LeaveTypeService,
    LeaveRequestService,
    LeaveBalanceService,
    {
      provide: 'EMPLOYEE_PROFILE_REPOSITORY',
      useValue: EmployeeProfile,
    },
  ],
  controllers: [
    LeaveTypeController,
    LeaveRequestController,
    LeaveBalanceController,
  ],
 
  exports: [
    LeaveTypeService,
    LeaveRequestService,
    LeaveBalanceService,
  ],
})
export class LeaveManagementModule {}

