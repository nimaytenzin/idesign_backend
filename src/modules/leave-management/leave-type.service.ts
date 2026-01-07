import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LeaveType } from './entities/leave-type.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';

@Injectable()
export class LeaveTypeService {
  constructor(
    @InjectModel(LeaveType)
    private leaveTypeModel: typeof LeaveType,
    @InjectModel(LeaveRequest)
    private leaveRequestModel: typeof LeaveRequest,
  ) {}

  async create(createLeaveTypeDto: CreateLeaveTypeDto): Promise<LeaveType> {
    // Check if code already exists
    const existing = await this.leaveTypeModel.findOne({
      where: { code: createLeaveTypeDto.code },
    });

    if (existing) {
      throw new BadRequestException(
        `Leave type with code ${createLeaveTypeDto.code} already exists`,
      );
    }

    return this.leaveTypeModel.create({
      ...createLeaveTypeDto,
      canCarryForward: createLeaveTypeDto.canCarryForward ?? false,
      isActive: createLeaveTypeDto.isActive ?? true,
    });
  }

  async findAll(): Promise<LeaveType[]> {
    return this.leaveTypeModel.findAll({
      order: [['name', 'ASC']],
    });
  }

  async findOne(id: number): Promise<LeaveType> {
    const leaveType = await this.leaveTypeModel.findByPk(id);

    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID ${id} not found`);
    }

    return leaveType;
  }

  async update(
    id: number,
    updateLeaveTypeDto: UpdateLeaveTypeDto,
  ): Promise<LeaveType> {
    const leaveType = await this.findOne(id);

    // Check if code is being changed and if it conflicts
    if (updateLeaveTypeDto.code && updateLeaveTypeDto.code !== leaveType.code) {
      const existing = await this.leaveTypeModel.findOne({
        where: { code: updateLeaveTypeDto.code },
      });

      if (existing) {
        throw new BadRequestException(
          `Leave type with code ${updateLeaveTypeDto.code} already exists`,
        );
      }
    }

    await leaveType.update(updateLeaveTypeDto);

    return leaveType.reload();
  }

  async remove(id: number): Promise<void> {
    const leaveType = await this.findOne(id);

    // Check if leave type is being used
    const usageCount = await this.leaveRequestModel.count({
      where: { leaveTypeId: id },
    });

    if (usageCount > 0) {
      throw new BadRequestException(
        `Cannot delete leave type that has ${usageCount} leave request(s). Deactivate instead.`,
      );
    }

    await leaveType.destroy();
  }
}

