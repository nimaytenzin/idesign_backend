import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Inject } from '@nestjs/common';
import { LeaveBalance } from './entities/leave-balance.entity';
import { LeaveType } from './entities/leave-type.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { EmployeeProfile } from '../employee-management/employee-profile/entities/employee-profile.entity';
import { LeaveBalanceQueryDto } from './dto/leave-balance-query.dto';

@Injectable()
export class LeaveBalanceService {
  constructor(
    @InjectModel(LeaveBalance)
    private leaveBalanceModel: typeof LeaveBalance,
    @InjectModel(LeaveType)
    private leaveTypeModel: typeof LeaveType,
    @InjectModel(User)
    private userModel: typeof User,
    @Inject('EMPLOYEE_PROFILE_REPOSITORY')
    private employeeProfileModel: typeof EmployeeProfile,
  ) {}

  async getBalance(
    userId: number,
    leaveTypeId: number,
    year: number,
  ): Promise<LeaveBalance> {
    let balance = await this.leaveBalanceModel.findOne({
      where: { userId, leaveTypeId, year },
      include: [{ model: LeaveType }],
    });

    // If balance doesn't exist, initialize it
    if (!balance) {
      balance = await this.initializeBalance(userId, leaveTypeId, year);
    }

    return balance;
  }

  async initializeBalance(
    userId: number,
    leaveTypeId: number,
    year: number,
  ): Promise<LeaveBalance> {
    // Verify user exists
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Verify leave type exists
    const leaveType = await this.leaveTypeModel.findByPk(leaveTypeId);
    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID ${leaveTypeId} not found`);
    }

    // Check if balance already exists
    const existing = await this.leaveBalanceModel.findOne({
      where: { userId, leaveTypeId, year },
    });

    if (existing) {
      return existing;
    }

    // Get previous year's balance for carry forward
    let carriedForwardDays = 0;
    if (leaveType.canCarryForward && year > new Date().getFullYear() - 10) {
      const previousYear = year - 1;
      const previousBalance = await this.leaveBalanceModel.findOne({
        where: { userId, leaveTypeId, year: previousYear },
      });

      if (previousBalance) {
        const unusedDays =
          previousBalance.allocatedDays +
          previousBalance.carriedForwardDays -
          previousBalance.usedDays;

        if (unusedDays > 0) {
          // Apply max carry forward limit if set
          if (leaveType.maxCarryForwardDays) {
            carriedForwardDays = Math.min(
              unusedDays,
              leaveType.maxCarryForwardDays,
            );
          } else {
            carriedForwardDays = unusedDays;
          }
        }
      }
    }

    // Create new balance
    return this.leaveBalanceModel.create({
      userId,
      leaveTypeId,
      year,
      allocatedDays: leaveType.daysPerYear,
      usedDays: 0,
      carriedForwardDays,
    });
  }

  async deductBalance(
    userId: number,
    leaveTypeId: number,
    year: number,
    days: number,
  ): Promise<LeaveBalance> {
    const balance = await this.getBalance(userId, leaveTypeId, year);

    if (balance.availableDays < days) {
      throw new BadRequestException('Insufficient leave balance');
    }

    balance.usedDays += days;
    await balance.save();

    return balance.reload();
  }

  async restoreBalance(
    userId: number,
    leaveTypeId: number,
    year: number,
    days: number,
  ): Promise<LeaveBalance> {
    const balance = await this.getBalance(userId, leaveTypeId, year);

    balance.usedDays = Math.max(0, balance.usedDays - days);
    await balance.save();

    return balance.reload();
  }

  async getAllBalances(
    query: LeaveBalanceQueryDto,
  ): Promise<LeaveBalance[]> {
    const where: any = {};
    const year = query.year || new Date().getFullYear();

    where.year = year;

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.leaveTypeId) {
      where.leaveTypeId = query.leaveTypeId;
    }

    return this.leaveBalanceModel.findAll({
      where,
      include: [
        { model: User },
        { model: LeaveType },
      ],
      order: [['userId', 'ASC'], ['leaveTypeId', 'ASC']],
    });
  }

  async getBalancesForUser(
    userId: number,
    year?: number,
  ): Promise<LeaveBalance[]> {
    const targetYear = year || new Date().getFullYear();

    return this.leaveBalanceModel.findAll({
      where: { userId, year: targetYear },
      include: [{ model: LeaveType }],
      order: [['leaveTypeId', 'ASC']],
    });
  }

  /**
   * Initialize balances for all active users and leave types for a given year
   * This should be called at the start of each calendar year
   */
  async initializeYearBalances(year: number): Promise<void> {
    // Get all active staff users by joining with EmployeeProfile
    const users = await this.userModel.findAll({
      where: {
        role: UserRole.STAFF,
        isActive: true,
      },
      include: [
        {
          model: EmployeeProfile,
          as: 'employeeProfile',
          where: {
            employeeStatus: 'ACTIVE',
          },
          required: true, // Inner join - only users with active employee profiles
        },
      ],
    });

    const leaveTypes = await this.leaveTypeModel.findAll({
      where: { isActive: true },
    });

    for (const user of users) {
      for (const leaveType of leaveTypes) {
        await this.initializeBalance(user.id, leaveType.id, year);
      }
    }
  }
}

