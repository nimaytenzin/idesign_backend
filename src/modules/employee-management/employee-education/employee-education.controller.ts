import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { EmployeeEducationService } from './employee-education.service';
import { CreateEmployeeEducationDto } from './dto/create-employee-education.dto';
import { UpdateEmployeeEducationDto } from './dto/update-employee-education.dto';
import { UserRole } from 'src/modules/auth/entities/user.entity';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('employee-education')
export class EmployeeEducationController {
  constructor(private readonly employeeEducationService: EmployeeEducationService) {}

  @Post(':userId')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  create(@Param('userId') userId: string, @Body() createEducationDto: CreateEmployeeEducationDto) {
    return this.employeeEducationService.create(+userId, createEducationDto);
  }

  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAll(@Param('userId') userId: string) {
    return this.employeeEducationService.findAll(+userId);
  }


  @Patch(':userId/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  update(
    @Param('userId') userId: string,
    @Param('id') id: string,
    @Body() updateEducationDto: UpdateEmployeeEducationDto,
  ) {
    return this.employeeEducationService.update(+userId, +id, updateEducationDto);
  }

  @Delete(':userId/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  remove(@Param('userId') userId: string, @Param('id') id: string) {
    return this.employeeEducationService.remove(+userId, +id);
  }
}
