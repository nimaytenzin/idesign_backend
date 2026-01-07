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

@Module({
  imports: [
    SequelizeModule.forFeature([LeaveType, LeaveRequest, LeaveBalance, User]),
  ],
  controllers: [
    LeaveTypeController,
    LeaveRequestController,
    LeaveBalanceController,
  ],
  providers: [
    LeaveTypeService,
    LeaveRequestService,
    LeaveBalanceService,
  ],
  exports: [
    LeaveTypeService,
    LeaveRequestService,
    LeaveBalanceService,
  ],
})
export class LeaveManagementModule {}

