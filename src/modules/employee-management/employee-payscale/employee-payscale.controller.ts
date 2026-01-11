import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { EmployeePayscaleService } from './employee-payscale.service';
import { CreateEmployeePayscaleDto } from './dto/create-employee-payscale.dto';
import { UpdateEmployeePayscaleDto } from './dto/update-employee-payscale.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { UserRole } from 'src/modules/auth/entities/user.entity';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

@Controller('employee-payscale')
export class EmployeePayscaleController {
  constructor(
    private readonly employeePayscaleService: EmployeePayscaleService,
  ) {}

  /**
   * Create a new payscale for a user
   * Accessible by ADMIN only
   * 
   * @param createPayscaleDto - Payscale data to create
   * @returns Created payscale information
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  createPayscale(@Body() createPayscaleDto: CreateEmployeePayscaleDto) {
    return this.employeePayscaleService.createPayscale(createPayscaleDto);
  }

  /**
   * Get payscale by user ID
   * Accessible by ADMIN and STAFF
   * 
   * @param userId - The user ID to get payscale for
   * @returns Employee payscale information
   */
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  getPayscaleByUserId(@Param('userId') userId: string) {
    return this.employeePayscaleService.getPayscaleByUserId(+userId);
  }

  /**
   * Update payscale for a user
   * Accessible by ADMIN only
   * 
   * @param userId - The user ID whose payscale to update
   * @param updatePayscaleDto - Updated payscale data
   * @returns Updated payscale information
   */
  @Patch('user/:userId')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  updatePayscale(
    @Param('userId') userId: string,
    @Body() updatePayscaleDto: UpdateEmployeePayscaleDto,
  ) {
    return this.employeePayscaleService.updatePayscale(+userId, updatePayscaleDto);
  }
}
