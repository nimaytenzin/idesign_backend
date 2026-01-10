import { Controller, Get, Post, Body, Patch, Param, Delete,   UseGuards,
} from '@nestjs/common';
import { EmployeeProfileService } from './employee-profile.service';
 import { CreateEmployeeProfileDto } from './dto/create-employee-profile.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { UserRole } from 'src/modules/auth/entities/user.entity';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';

@Controller('employee-profile')
export class EmployeeProfileController {
  constructor(private readonly employeeProfileService: EmployeeProfileService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  create(@Body() data: CreateEmployeeProfileDto) {
    return this.employeeProfileService.createEmployeeProfile(data);
  }


  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  update(@Param('id') id: string, @Body() data: UpdateEmployeeProfileDto) {
    return this.employeeProfileService.update(+id, data);
  }

  
}
