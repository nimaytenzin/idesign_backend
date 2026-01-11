import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Attendance } from './entities/attendance.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { AttendanceResponseDto } from './dto/attendance-response.dto';
import { StaffAttendanceResponseDto } from './dto/staff-attendance-response.dto';
import { CompanyService } from '../company/company-profile/company.service';
import { calculateDistance } from './utils/location.util';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    @Inject('ATTENDANCE_REPOSITORY')
    private readonly attendanceRepository: typeof Attendance,
    @Inject('USER_REPOSITORY')
    private readonly userRepository: typeof User,
    private readonly companyService: CompanyService,
  ) {}

  /**
   * Mark attendance for a staff user
   * Validates location is within 5000m of office
   * If entry already exists for the day, returns existing record
   */
  async markAttendance(
    userId: number,
    createDto: CreateAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    // Get company location
    const company = await this.companyService.findOne();
    
    if (!company.lat || !company.long) {
      throw new NotFoundException(
        'Office location is not configured. Please contact administrator.',
      );
    }

    // Log company location (office coordinates)
    this.logger.log(
      `[Attendance Mark] Company/Office Location - Latitude: ${company.lat}, Longitude: ${company.long}`,
    );

    // Log user location (device coordinates)
    this.logger.log(
      `[Attendance Mark] User Location (userId: ${userId}) - Latitude: ${createDto.lat}, Longitude: ${createDto.long}`,
    );

    // Calculate distance
    const distance = calculateDistance(
      createDto.lat,
      createDto.long,
      company.lat,
      company.long,
    );

    // Log calculated distance with both coordinates
    this.logger.log(
      `[Attendance Mark] Distance Calculation - From User (Lat: ${createDto.lat}, Long: ${createDto.long}) to Office (Lat: ${company.lat}, Long: ${company.long}) = ${distance.toFixed(2)} meters`,
    );

    // Validate distance (must be less than 5000m)
    if (distance >= 5000) {
      this.logger.warn(
        `Attendance rejected - Distance ${distance.toFixed(2)}m exceeds 5000m limit for userId: ${userId}`,
      );
      throw new BadRequestException(
        'Please go to the office to mark your attendance',
      );
    }

    this.logger.log(
      `Distance validation passed - ${distance.toFixed(2)}m is within 5000m limit for userId: ${userId}`,
    );

    // Get today's date (date only, no time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDate = today.toISOString().split('T')[0];

    // Check if attendance already exists for today
    const existingAttendance = await this.attendanceRepository.findOne({
      where: {
        userId,
        date: todayDate,
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'emailAddress', 'role'],
        },
      ],
    });

    // If entry exists, return it without error
    if (existingAttendance) {
      return this.mapToResponseDto(existingAttendance);
    }

    // Prevent future dates
    const attendanceDate = new Date(todayDate);
    if (attendanceDate > today) {
      throw new BadRequestException('Cannot mark attendance for future dates');
    }

    // Create attendance record
    const attendance = await this.attendanceRepository.create({
      userId,
      date: new Date(todayDate),
      attendanceTime: new Date(),
      userLat: createDto.lat,
      userLong: createDto.long,
      distanceFromOffice: Math.round(distance * 100) / 100, // Round to 2 decimal places
    });

    // Reload with user relationship
    const attendanceWithUser = await this.attendanceRepository.findByPk(
      attendance.id,
      {
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'emailAddress', 'role'],
          },
        ],
      },
    );

    return this.mapToResponseDto(attendanceWithUser);
  }

  /**
   * Get all staff attendance for today
   * Returns all users with role STAFF and their attendance status for today
   */
  async getStaffAttendanceForToday(): Promise<StaffAttendanceResponseDto[]> {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDate = today.toISOString().split('T')[0];

    // Get all staff users
    const staffUsers = await this.userRepository.findAll({
      where: {
        role: UserRole.STAFF,
        isActive: true,
      },
      attributes: ['id', 'name', 'emailAddress'],
      order: [['name', 'ASC']],
    });

    // Get all attendance records for today
    const todayAttendance = await this.attendanceRepository.findAll({
      where: {
        date: todayDate,
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'emailAddress'],
          where: {
            role: UserRole.STAFF,
            isActive: true,
          },
        },
      ],
    });

    // Create a map of userId -> attendance for quick lookup
    const attendanceMap = new Map<number, Attendance>();
    todayAttendance.forEach((attendance) => {
      attendanceMap.set(attendance.userId, attendance);
    });

    // Build response array
    const result: StaffAttendanceResponseDto[] = staffUsers.map((user) => {
      const attendance = attendanceMap.get(user.id);
      return {
        userId: user.id,
        userName: user.name,
        userEmail: user.emailAddress,
        attendance: attendance
          ? {
              id: attendance.id,
              date: attendance.date,
              attendanceTime: attendance.attendanceTime,
              distanceFromOffice: attendance.distanceFromOffice,
            }
          : undefined,
      };
    });

    return result;
  }

  /**
   * Get today's attendance for a specific user
   * Returns attendance record if exists, null otherwise
   */
  async getTodayAttendanceByUserId(
    userId: number,
  ): Promise<AttendanceResponseDto | null> {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDate = today.toISOString().split('T')[0];

    // Find attendance for today
    const attendance = await this.attendanceRepository.findOne({
      where: {
        userId,
        date: todayDate,
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'emailAddress', 'role'],
        },
      ],
    });

    if (!attendance) {
      return null;
    }

    return this.mapToResponseDto(attendance);
  }

  /**
   * Map attendance entity to response DTO
   */
  private mapToResponseDto(attendance: Attendance): AttendanceResponseDto {
    return {
      id: attendance.id,
      userId: attendance.userId,
      date: attendance.date,
      attendanceTime: attendance.attendanceTime,
      userLat: attendance.userLat,
      userLong: attendance.userLong,
      distanceFromOffice: attendance.distanceFromOffice,
      createdAt: attendance.createdAt,
      updatedAt: attendance.updatedAt,
      user: attendance.user
        ? {
            id: attendance.user.id,
            name: attendance.user.name,
            emailAddress: attendance.user.emailAddress,
            role: attendance.user.role,
          }
        : undefined,
    };
  }
}
