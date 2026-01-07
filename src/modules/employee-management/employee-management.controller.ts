import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { EmployeeManagementService } from './employee-management.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { ResetStaffPasswordDto } from './dto/reset-staff-password.dto';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { CreateWorkExperienceDto } from './dto/create-work-experience.dto';
import { UpdateWorkExperienceDto } from './dto/update-work-experience.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

// Multer configuration for employee profile picture uploads
const profilePictureStorage = diskStorage({
  destination: './uploads/employee-profiles',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    const filename = `profile-${uniqueSuffix}${ext}`;
    callback(null, filename);
  },
});

@Controller('employee-management')
export class EmployeeManagementController {
  constructor(
    private readonly employeeManagementService: EmployeeManagementService,
  ) {}

  @Post('staff')
  @Roles(UserRole.ADMIN)
  async createStaff(@Body() createStaffDto: CreateStaffDto) {
    return this.employeeManagementService.createStaff(createStaffDto);
  }

  @Get('staff')
  @Roles(UserRole.ADMIN)
  async findAllStaff() {
    return this.employeeManagementService.findAllStaff();
  }

  @Get('staff/:id')
  @Roles(UserRole.ADMIN)
  async findOneStaff(@Param('id') id: string) {
    return this.employeeManagementService.findOneStaff(+id);
  }

  @Patch('staff/:id')
  @Roles(UserRole.ADMIN)
  async updateStaff(
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
  ) {
    return this.employeeManagementService.updateStaff(+id, updateStaffDto);
  }

  @Post('staff/:id/reset-password')
  async resetStaffPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetStaffPasswordDto,
  ) {
    return this.employeeManagementService.resetStaffPassword(
      +id,
      resetPasswordDto,
    );
  }

  @Delete('staff/:id')
  async removeStaff(@Param('id') id: string) {
    return this.employeeManagementService.removeStaff(+id);
  }

  // Education Qualifications Endpoints
  @Get('staff/:id/education')
  async getStaffEducation(@Param('id') id: string) {
    return this.employeeManagementService.getStaffEducation(+id);
  }

  @Post('staff/:id/education')
  async addEducation(
    @Param('id') id: string,
    @Body() createEducationDto: CreateEducationDto,
  ) {
    return this.employeeManagementService.addEducation(
      +id,
      createEducationDto,
    );
  }

  @Patch('staff/:id/education/:educationId')
  async updateEducation(
    @Param('id') id: string,
    @Param('educationId') educationId: string,
    @Body() updateEducationDto: UpdateEducationDto,
  ) {
    return this.employeeManagementService.updateEducation(
      +id,
      +educationId,
      updateEducationDto,
    );
  }

  @Delete('staff/:id/education/:educationId')
  async deleteEducation(
    @Param('id') id: string,
    @Param('educationId') educationId: string,
  ) {
    return this.employeeManagementService.deleteEducation(+id, +educationId);
  }

  // Work Experience Endpoints
  @Get('staff/:id/work-experience')
  async getStaffWorkExperience(@Param('id') id: string) {
    return this.employeeManagementService.getStaffWorkExperience(+id);
  }

  @Post('staff/:id/work-experience')
  async addWorkExperience(
    @Param('id') id: string,
    @Body() createWorkExperienceDto: CreateWorkExperienceDto,
  ) {
    return this.employeeManagementService.addWorkExperience(
      +id,
      createWorkExperienceDto,
    );
  }

  @Patch('staff/:id/work-experience/:experienceId')
  async updateWorkExperience(
    @Param('id') id: string,
    @Param('experienceId') experienceId: string,
    @Body() updateWorkExperienceDto: UpdateWorkExperienceDto,
  ) {
    return this.employeeManagementService.updateWorkExperience(
      +id,
      +experienceId,
      updateWorkExperienceDto,
    );
  }

  @Delete('staff/:id/work-experience/:experienceId')
  async deleteWorkExperience(
    @Param('id') id: string,
    @Param('experienceId') experienceId: string,
  ) {
    return this.employeeManagementService.deleteWorkExperience(
      +id,
      +experienceId,
    );
  }

  // Profile Picture Upload Endpoint
  @Post('staff/:id/profile-picture')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      storage: profilePictureStorage,
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadProfilePicture(
    @Param('id') id: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.employeeManagementService.uploadProfilePicture(
      +id,
      `/uploads/employee-profiles/${file.filename}`,
    );
  }
}

