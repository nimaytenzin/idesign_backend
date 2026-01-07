import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { LeaveRequest, LeaveRequestStatus } from './entities/leave-request.entity';
import { LeaveType } from './entities/leave-type.entity';
import { LeaveBalance } from './entities/leave-balance.entity';
import { User } from '../auth/entities/user.entity';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { LeaveRequestQueryDto } from './dto/leave-request-query.dto';
import { LeaveBalanceService } from './leave-balance.service';

@Injectable()
export class LeaveRequestService {
  constructor(
    @InjectModel(LeaveRequest)
    private leaveRequestModel: typeof LeaveRequest,
    @InjectModel(LeaveType)
    private leaveTypeModel: typeof LeaveType,
    @InjectModel(User)
    private userModel: typeof User,
    private leaveBalanceService: LeaveBalanceService,
  ) {}

  /**
   * Calculate number of days between two dates (inclusive)
   */
  private calculateDays(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Inclusive of both start and end dates
  }

  async create(
    userId: number,
    createLeaveRequestDto: CreateLeaveRequestDto,
  ): Promise<LeaveRequest> {
    // Validate leave type exists
    const leaveType = await this.leaveTypeModel.findByPk(
      createLeaveRequestDto.leaveTypeId,
    );
    if (!leaveType) {
      throw new NotFoundException('Leave type not found');
    }

    if (!leaveType.isActive) {
      throw new BadRequestException('Leave type is not active');
    }

    // Validate dates
    const startDate = new Date(createLeaveRequestDto.startDate);
    const endDate = new Date(createLeaveRequestDto.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    if (endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Calculate number of days
    const numberOfDays = this.calculateDays(startDate, endDate);

    // Check for overlapping leave requests
    const overlapping = await this.leaveRequestModel.findOne({
      where: {
        userId,
        status: {
          [Op.in]: [LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED],
        },
        [Op.or]: [
          {
            startDate: { [Op.between]: [startDate, endDate] },
          },
          {
            endDate: { [Op.between]: [startDate, endDate] },
          },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: startDate } },
              { endDate: { [Op.gte]: endDate } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      throw new BadRequestException(
        'You have an overlapping leave request that is pending or approved',
      );
    }

    // Check available balance
    const currentYear = new Date().getFullYear();
    const balance = await this.leaveBalanceService.getBalance(
      userId,
      createLeaveRequestDto.leaveTypeId,
      currentYear,
    );

    if (balance.availableDays < numberOfDays) {
      throw new BadRequestException(
        `Insufficient leave balance. Available: ${balance.availableDays} days, Requested: ${numberOfDays} days`,
      );
    }

    // Create leave request
    return this.leaveRequestModel.create({
      userId,
      leaveTypeId: createLeaveRequestDto.leaveTypeId,
      startDate,
      endDate,
      numberOfDays,
      reason: createLeaveRequestDto.reason,
      status: LeaveRequestStatus.PENDING,
      appliedAt: new Date(),
    });
  }

  async findAll(
    query: LeaveRequestQueryDto,
    currentUserId?: number,
    isAdmin?: boolean,
  ): Promise<LeaveRequest[]> {
    const where: any = {};

    // Non-admins can only see their own requests
    if (!isAdmin && currentUserId) {
      where.userId = currentUserId;
    } else if (query.userId) {
      where.userId = query.userId;
    }

    if (query.leaveTypeId) {
      where.leaveTypeId = query.leaveTypeId;
    }

    if (query.status) {
      where.status = query.status;
    }

    // Date filtering
    if (query.year || query.month) {
      const year = query.year || new Date().getFullYear();
      const month = query.month || null;

      if (month) {
        const startDate = new Date(Date.UTC(year, month - 1, 1));
        const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
        where[Op.or] = [
          {
            startDate: { [Op.between]: [startDate, endDate] },
          },
          {
            endDate: { [Op.between]: [startDate, endDate] },
          },
        ];
      } else {
        const startDate = new Date(Date.UTC(year, 0, 1));
        const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
        where[Op.or] = [
          {
            startDate: { [Op.between]: [startDate, endDate] },
          },
          {
            endDate: { [Op.between]: [startDate, endDate] },
          },
        ];
      }
    }

    return this.leaveRequestModel.findAll({
      where,
      include: [
        { model: User, as: 'user' },
        { model: User, as: 'approver' },
        { model: LeaveType },
      ],
      order: [['appliedAt', 'DESC']],
    });
  }

  async findOne(id: number, currentUserId?: number, isAdmin?: boolean): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRequestModel.findByPk(id, {
      include: [
        { model: User, as: 'user' },
        { model: User, as: 'approver' },
        { model: LeaveType },
      ],
    });

    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    // Non-admins can only view their own requests
    if (!isAdmin && leaveRequest.userId !== currentUserId) {
      throw new ForbiddenException('You can only view your own leave requests');
    }

    return leaveRequest;
  }

  async findByUser(userId: number): Promise<LeaveRequest[]> {
    return this.leaveRequestModel.findAll({
      where: { userId },
      include: [
        { model: User, as: 'user' },
        { model: User, as: 'approver' },
        { model: LeaveType },
      ],
      order: [['appliedAt', 'DESC']],
    });
  }

  async approve(
    id: number,
    adminId: number,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRequestModel.findByPk(id, {
      include: [{ model: LeaveType }],
    });

    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve leave request with status ${leaveRequest.status}`,
      );
    }

    // Check balance again before approving
    const currentYear = new Date().getFullYear();
    const balance = await this.leaveBalanceService.getBalance(
      leaveRequest.userId,
      leaveRequest.leaveTypeId,
      currentYear,
    );

    if (balance.availableDays < leaveRequest.numberOfDays) {
      throw new BadRequestException(
        `Insufficient leave balance. Available: ${balance.availableDays} days, Requested: ${leaveRequest.numberOfDays} days`,
      );
    }

    // Update leave request
    await leaveRequest.update({
      status: LeaveRequestStatus.APPROVED,
      approvedBy: adminId,
      approvedAt: new Date(),
    });

    // Deduct from balance
    await this.leaveBalanceService.deductBalance(
      leaveRequest.userId,
      leaveRequest.leaveTypeId,
      currentYear,
      leaveRequest.numberOfDays,
    );

    return this.findOne(id, undefined, true);
  }

  async reject(
    id: number,
    adminId: number,
    rejectionReason?: string,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRequestModel.findByPk(id);

    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject leave request with status ${leaveRequest.status}`,
      );
    }

    await leaveRequest.update({
      status: LeaveRequestStatus.REJECTED,
      approvedBy: adminId,
      approvedAt: new Date(),
      rejectionReason: rejectionReason || 'Rejected by admin',
    });

    return this.findOne(id, undefined, true);
  }

  async cancel(
    id: number,
    currentUserId: number,
    isAdmin: boolean,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRequestModel.findByPk(id);

    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    // Only the applicant or admin can cancel
    if (!isAdmin && leaveRequest.userId !== currentUserId) {
      throw new ForbiddenException('You can only cancel your own leave requests');
    }

    if (leaveRequest.status === LeaveRequestStatus.CANCELLED) {
      throw new BadRequestException('Leave request is already cancelled');
    }

    // If approved, restore balance
    if (leaveRequest.status === LeaveRequestStatus.APPROVED) {
      const currentYear = new Date().getFullYear();
      await this.leaveBalanceService.restoreBalance(
        leaveRequest.userId,
        leaveRequest.leaveTypeId,
        currentYear,
        leaveRequest.numberOfDays,
      );
    }

    await leaveRequest.update({
      status: LeaveRequestStatus.CANCELLED,
    });

    return this.findOne(id, currentUserId, isAdmin);
  }
}

