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

  /**
   * Get all staff for public page display
   * 
   * @description Returns a list of all active staff members with their employee profiles
   * for display on a public page. This is a public endpoint (no authentication required).
   * Only returns: name, department, position, and bio.
   * 
   * @route GET /employee-profile/public/staff
   * @access Public
   * 
   * @returns {Array} Array of staff objects containing:
   *   - name: Staff member's name
   *   - department: Department name
   *   - position: Position/title
   *   - bio: Staff member's bio
   * 
   * @example Response:
   * [
   *   {
   *     "name": "John Doe",
   *     "department": "Engineering",
   *     "position": "Senior Developer",
   *     "bio": "John is a passionate developer with 10 years of experience..."
   *   },
   *   {
   *     "name": "Jane Smith",
   *     "department": "Design",
   *     "position": "Lead Designer",
   *     "bio": "Jane specializes in user experience and interface design..."
   *   }
   * ]
   */
  @Get('public/staff')
  async getPublicStaffList() {
    return this.employeeProfileService.getPublicStaffList();
  }

  
}
