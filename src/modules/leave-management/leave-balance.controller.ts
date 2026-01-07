import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { LeaveBalanceService } from './leave-balance.service';
import { LeaveBalanceQueryDto } from './dto/leave-balance-query.dto';
import { LeaveBalance } from './entities/leave-balance.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('leave-balances')
@UseGuards(JwtAuthGuard)
export class LeaveBalanceController {
  constructor(private readonly leaveBalanceService: LeaveBalanceService) {}

  @Get()
  async findAll(@Query() query: LeaveBalanceQueryDto): Promise<LeaveBalance[]> {
    return this.leaveBalanceService.getAllBalances(query);
  }

  @Get('user/:userId')
  async getBalancesForUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('year') year?: string,
  ): Promise<LeaveBalance[]> {
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.leaveBalanceService.getBalancesForUser(userId, yearNum);
  }

  @Get('user/:userId/year/:year')
  async getBalancesForUserAndYear(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('year', ParseIntPipe) year: number,
  ): Promise<LeaveBalance[]> {
    return this.leaveBalanceService.getBalancesForUser(userId, year);
  }

  @Post('initialize/:year')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async initializeYearBalances(
    @Param('year', ParseIntPipe) year: number,
  ): Promise<{ message: string }> {
    await this.leaveBalanceService.initializeYearBalances(year);
    return { message: `Leave balances initialized for year ${year}` };
  }
}

