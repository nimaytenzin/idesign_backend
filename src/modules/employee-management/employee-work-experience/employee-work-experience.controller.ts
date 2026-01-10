import { Controller, Get, Post, Body, Patch, Param, Delete,   UseGuards,
} from '@nestjs/common';
import { EmployeeWorkExperienceService } from './employee-work-experience.service';
import { CreateEmployeeWorkExperienceDto } from './dto/create-employee-work-experience.dto';
import { UserRole } from 'src/modules/auth/entities/user.entity';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { UpdateEmployeeWorkExperienceDto } from './dto/update-employee-work-experience.dto';

@Controller('employee-work-experience')
export class EmployeeWorkExperienceController {
  constructor(private readonly employeeWorkExperienceService: EmployeeWorkExperienceService) {}

  @Post(':userId')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  create(@Param('userId') userId: string, @Body() createWorkExperienceDto: CreateEmployeeWorkExperienceDto) {
    return this.employeeWorkExperienceService.create(+userId, createWorkExperienceDto);
  }

  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAll(@Param('userId') userId: string) {
    return this.employeeWorkExperienceService.findAllByUserId(+userId);
  }

  @Patch(':userId/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  update(
    @Param('userId') userId: string,
    @Param('id') id: string,
    @Body() updateWorkExperienceDto: UpdateEmployeeWorkExperienceDto,
  ) {
    return this.employeeWorkExperienceService.update(+userId, +id, updateWorkExperienceDto);
  }

  @Delete(':userId/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  remove(@Param('userId') userId: string, @Param('id') id: string) {
    return this.employeeWorkExperienceService.remove(+userId, +id);
  }
}
