import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { LeaveRequestService } from './leave-request.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { LeaveRequestQueryDto } from './dto/leave-request-query.dto';
import { LeaveRequest } from './entities/leave-request.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('leave-requests')
@UseGuards(JwtAuthGuard)
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createLeaveRequestDto: CreateLeaveRequestDto,
    @Request() req: any,
  ): Promise<LeaveRequest> {
    const userId = req.user.id;
    return this.leaveRequestService.create(userId, createLeaveRequestDto);
  }

  @Get()
  async findAll(
    @Query() query: LeaveRequestQueryDto,
    @Request() req: any,
  ): Promise<LeaveRequest[]> {
    const userId = req.user.id;
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.leaveRequestService.findAll(query, userId, isAdmin);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<LeaveRequest> {
    const userId = req.user.id;
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.leaveRequestService.findOne(id, userId, isAdmin);
  }

  @Get('user/:userId')
  async findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req: any,
  ): Promise<LeaveRequest[]> {
    const currentUserId = req.user.id;
    const isAdmin = req.user.role === UserRole.ADMIN;

    // Non-admins can only view their own requests
    if (!isAdmin && userId !== currentUserId) {
      throw new ForbiddenException('You can only view your own leave requests');
    }

    return this.leaveRequestService.findByUser(userId);
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<LeaveRequest> {
    const adminId = req.user.id;
    return this.leaveRequestService.approve(id, adminId);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { rejectionReason?: string },
    @Request() req: any,
  ): Promise<LeaveRequest> {
    const adminId = req.user.id;
    return this.leaveRequestService.reject(id, adminId, body.rejectionReason);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<LeaveRequest> {
    const userId = req.user.id;
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.leaveRequestService.cancel(id, userId, isAdmin);
  }
}

