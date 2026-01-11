import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { EmployeeProfileService } from './employee-profile.service';
import { CreateEmployeeProfileDto } from './dto/create-employee-profile.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { UserRole } from 'src/modules/auth/entities/user.entity';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
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

  /**
   * Get current user's employee profile
   * Accessible by STAFF only
   * 
   * @description Allows staff users to view their own employee profile.
   * Uses the authenticated user's ID from JWT token.
   * 
   * @route GET /employee-profile/me
   * @access Private (Staff)
   * 
   * @param req - Request object containing authenticated user info
   * @returns Employee profile with user information
   * 
   * @throws {404} Not Found - If employee profile not found for the user
   */
  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF)
  async getMyEmployeeProfile(@Request() req: any) {
    const userId = req.user.id;
    return this.employeeProfileService.getEmployeeProfileByUserId(userId);
  }

  /**
   * Get employee profile by user ID
   * Accessible by ADMIN and STAFF
   * 
   * @description Allows staff users to view their own employee profile and
   * administrators to view any employee profile. Staff users can only access
   * their own profile (validated via JWT token).
   * 
   * @route GET /employee-profile/user/:userId
   * @access Private (Staff, Admin)
   * 
   * @param userId - The user ID to get employee profile for
   * @param req - Request object containing authenticated user info
   * @returns Employee profile with user information
   * 
   * @throws {403} Forbidden - If staff user tries to access another user's profile
   * @throws {404} Not Found - If employee profile not found for the user
   * 
   * @example Response:
   * {
   *   "id": 1,
   *   "userId": 5,
   *   "department": "Engineering",
   *   "position": "Senior Developer",
   *   "bio": "Experienced developer...",
   *   "hireDate": "2020-01-15T00:00:00.000Z",
   *   "terminationDate": null,
   *   "employeeStatus": "ACTIVE",
   *   "user": {
   *     "id": 5,
   *     "name": "John Doe",
   *     "emailAddress": "john@example.com",
   *     "phoneNumber": "+975-17123456",
   *     "currentAddress": "Thimphu, Bhutan",
   *     "permanentAddress": "Paro, Bhutan",
   *     "dateOfBirth": "1990-05-15T00:00:00.000Z",
   *     "profileImageUrl": "https://...",
   *     "role": "STAFF",
   *     "isActive": true
   *   }
   * }
   */
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getEmployeeProfileByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req: any,
  ) {
    const currentUserId = req.user.id;
    const isAdmin = req.user.role === UserRole.ADMIN;

    // Non-admins can only view their own profile
    if (!isAdmin && userId !== currentUserId) {
      throw new ForbiddenException(
        'You can only view your own employee profile',
      );
    }

    return this.employeeProfileService.getEmployeeProfileByUserId(userId);
  }
}
