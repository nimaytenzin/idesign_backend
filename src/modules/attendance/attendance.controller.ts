import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { AttendanceResponseDto } from './dto/attendance-response.dto';
import { StaffAttendanceResponseDto } from './dto/staff-attendance-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**
   * Mark attendance for the current user
   * Access: STAFF only
   * 
   * @description Allows staff users to mark their attendance for the day.
   * Validates that the user's device location is within 5000m of the office.
   * If attendance already exists for today, returns the existing record.
   * 
   * @route POST /attendance/mark
   * @access Private (Staff only)
   * 
   * @param createDto - Contains lat and long coordinates of user's device
   * @param req - Request object containing authenticated user info
   * @returns AttendanceResponseDto with attendance details
   * 
   * @throws {400} Bad Request - If location is too far from office (>=5000m) or invalid date
   * @throws {403} Forbidden - If user is not STAFF
   * @throws {404} Not Found - If office location is not configured
   */
  @Post('mark')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF)
  @HttpCode(HttpStatus.OK)
  async markAttendance(
    @Body() createDto: CreateAttendanceDto,
    @Request() req: any,
  ): Promise<AttendanceResponseDto> {
    const userId = req.user.id;
    return this.attendanceService.markAttendance(userId, createDto);
  }

  /**
   * Get today's attendance for the current user
   * Access: STAFF only
   * 
   * @description Allows staff users to check their own attendance status for today.
   * Uses the authenticated user's ID from JWT token.
   * 
   * @route GET /attendance/me
   * @access Private (Staff only)
   * 
   * @param req - Request object containing authenticated user info
   * @returns AttendanceResponseDto if attendance marked, null if not marked
   * 
   * @example Response (if attendance marked):
   * {
   *   "id": 1,
   *   "userId": 5,
   *   "date": "2024-01-15",
   *   "attendanceTime": "2024-01-15T09:30:00.000Z",
   *   "userLat": 27.4725,
   *   "userLong": 89.6390,
   *   "distanceFromOffice": 125.50,
   *   "createdAt": "2024-01-15T09:30:00.000Z",
   *   "updatedAt": "2024-01-15T09:30:00.000Z",
   *   "user": {
   *     "id": 5,
   *     "name": "John Doe",
   *     "emailAddress": "john@example.com",
   *     "role": "STAFF"
   *   }
   * }
   * 
   * @example Response (if not marked):
   * null
   */
  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF)
  async getMyTodayAttendance(@Request() req: any): Promise<AttendanceResponseDto | null> {
    const userId = req.user.id;
    return this.attendanceService.getTodayAttendanceByUserId(userId);
  }

  /**
   * Get all staff attendance for today
   * Access: STAFF and ADMIN
   * 
   * @description Returns a list of all staff users with their attendance status for today.
   * Includes users who have marked attendance and those who haven't.
   * 
   * @route GET /attendance
   * @access Private (Staff, Admin)
   * 
   * @returns Array of StaffAttendanceResponseDto containing:
   *   - userId: User ID
   *   - userName: User name
   *   - userEmail: User email
   *   - attendance: Attendance details if marked, undefined if not marked
   * 
   * @example Response:
   * [
   *   {
   *     "userId": 1,
   *     "userName": "John Doe",
   *     "userEmail": "john@example.com",
   *     "attendance": {
   *       "id": 1,
   *       "date": "2024-01-15",
   *       "attendanceTime": "2024-01-15T09:00:00Z",
   *       "distanceFromOffice": 125.50
   *     }
   *   },
   *   {
   *     "userId": 2,
   *     "userName": "Jane Smith",
   *     "userEmail": "jane@example.com",
   *     "attendance": undefined
   *   }
   * ]
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  async getStaffAttendanceForToday(): Promise<StaffAttendanceResponseDto[]> {
    return this.attendanceService.getStaffAttendanceForToday();
  }
}
