import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { User, UserRole } from '../auth/entities/user.entity';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { ResetStaffPasswordDto } from './dto/reset-staff-password.dto';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { CreateWorkExperienceDto } from './dto/create-work-experience.dto';
import { UpdateWorkExperienceDto } from './dto/update-work-experience.dto';
import { EmployeeEducation } from './entities/employee-education.entity';
import { EmployeeWorkExperience } from './entities/employee-work-experience.entity';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class EmployeeManagementService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: typeof User,
    @Inject('EMPLOYEE_EDUCATION_REPOSITORY')
    private readonly educationRepository: typeof EmployeeEducation,
    @Inject('EMPLOYEE_WORK_EXPERIENCE_REPOSITORY')
    private readonly workExperienceRepository: typeof EmployeeWorkExperience,
  ) {}

  async createStaff(createStaffDto: CreateStaffDto) {
    // Check if user already exists by CID
    const existingUserByCid = await this.userRepository.findOne({
      where: { cid: createStaffDto.cid },
    });

    if (existingUserByCid) {
      throw new ConflictException('User with this CID already exists');
    }

    // Check if user already exists by email
    const existingUserByEmail = await this.userRepository.findOne({
      where: { emailAddress: createStaffDto.emailAddress },
    });

    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createStaffDto.password, 10);

    // Create staff user
    const staff = await this.userRepository.create({
      ...instanceToPlain(createStaffDto),
      password: hashedPassword,
      role: UserRole.STAFF,
      employeeStatus: 'ACTIVE',
    });

    // Remove password from response
    const { password, ...staffWithoutPassword } = staff.toJSON();

    return staffWithoutPassword;
  }

  async findAllStaff() {
    const staffList = await this.userRepository.findAll({
      where: {
        role: UserRole.STAFF,
      },
      order: [['name', 'ASC']],
    });

    // Remove passwords from response
    return staffList.map((staff) => {
      const { password, ...staffWithoutPassword } = staff.toJSON();
      return staffWithoutPassword;
    });
  }

  async findOneStaff(id: number) {
    const staff = await this.userRepository.findOne({
      where: {
        id,
        role: UserRole.STAFF,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    const { password, ...staffWithoutPassword } = staff.toJSON();
    return staffWithoutPassword;
  }

  async updateStaff(id: number, updateStaffDto: UpdateStaffDto) {
    const staff = await this.userRepository.findOne({
      where: {
        id,
        role: UserRole.STAFF,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    // Check if email is being updated and if it conflicts with existing user
    if (updateStaffDto.emailAddress && updateStaffDto.emailAddress !== staff.emailAddress) {
      const existingUserByEmail = await this.userRepository.findOne({
        where: { emailAddress: updateStaffDto.emailAddress },
      });

      if (existingUserByEmail && existingUserByEmail.id !== id) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Check if CID is being updated and if it conflicts with existing user
    if (updateStaffDto.cid && updateStaffDto.cid !== staff.cid) {
      const existingUserByCid = await this.userRepository.findOne({
        where: { cid: updateStaffDto.cid },
      });

      if (existingUserByCid && existingUserByCid.id !== id) {
        throw new ConflictException('User with this CID already exists');
      }
    }

    // Update staff
    await staff.update(updateStaffDto);

    // Return updated staff without password
    const updatedStaff = await this.findOneStaff(id);
    return updatedStaff;
  }

  async resetStaffPassword(id: number, resetPasswordDto: ResetStaffPasswordDto) {
    const staff = await this.userRepository.findOne({
      where: {
        id,
        role: UserRole.STAFF,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    // Update password
    staff.password = hashedPassword;
    await staff.save();

    return {
      message: 'Staff password has been reset successfully',
    };
  }

  async removeStaff(id: number) {
    const staff = await this.userRepository.findOne({
      where: {
        id,
        role: UserRole.STAFF,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    await staff.destroy();

    return {
      message: 'Staff member has been removed successfully',
    };
  }

  // Education Qualifications Methods
  async getStaffEducation(userId: number) {
    await this.findOneStaff(userId); // Verify staff exists
    return await this.educationRepository.findAll({
      where: { userId },
      order: [['startDate', 'DESC']],
    });
  }

  async addEducation(userId: number, createEducationDto: CreateEducationDto) {
    await this.findOneStaff(userId); // Verify staff exists

    // Calculate duration if not provided
    let durationDays = createEducationDto.durationDays;
    if (!durationDays) {
      const startDate = new Date(createEducationDto.startDate);
      const endDate = new Date(createEducationDto.endDate);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const education = await this.educationRepository.create({
      ...createEducationDto,
      userId,
      startDate: new Date(createEducationDto.startDate),
      endDate: new Date(createEducationDto.endDate),
      durationDays,
    });

    return education;
  }

  async updateEducation(
    userId: number,
    educationId: number,
    updateEducationDto: UpdateEducationDto,
  ) {
    await this.findOneStaff(userId); // Verify staff exists

    const education = await this.educationRepository.findOne({
      where: { id: educationId, userId },
    });

    if (!education) {
      throw new NotFoundException('Education qualification not found');
    }

    // Calculate duration if dates are being updated
    let updateData: any = { ...updateEducationDto };
    if (updateEducationDto.startDate || updateEducationDto.endDate) {
      const startDate = updateEducationDto.startDate
        ? new Date(updateEducationDto.startDate)
        : education.startDate;
      const endDate = updateEducationDto.endDate
        ? new Date(updateEducationDto.endDate)
        : education.endDate;
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      updateData.durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    if (updateEducationDto.startDate) {
      updateData.startDate = new Date(updateEducationDto.startDate);
    }
    if (updateEducationDto.endDate) {
      updateData.endDate = new Date(updateEducationDto.endDate);
    }

    await education.update(updateData);
    return education;
  }

  async deleteEducation(userId: number, educationId: number) {
    await this.findOneStaff(userId); // Verify staff exists

    const education = await this.educationRepository.findOne({
      where: { id: educationId, userId },
    });

    if (!education) {
      throw new NotFoundException('Education qualification not found');
    }

    await education.destroy();

    return {
      message: 'Education qualification has been removed successfully',
    };
  }

  // Work Experience Methods
  async getStaffWorkExperience(userId: number) {
    await this.findOneStaff(userId); // Verify staff exists
    return await this.workExperienceRepository.findAll({
      where: { userId },
      order: [['effectiveDate', 'DESC']],
    });
  }

  async addWorkExperience(
    userId: number,
    createWorkExperienceDto: CreateWorkExperienceDto,
  ) {
    await this.findOneStaff(userId); // Verify staff exists

    const workExperience = await this.workExperienceRepository.create({
      ...createWorkExperienceDto,
      userId,
      effectiveDate: new Date(createWorkExperienceDto.effectiveDate),
      endDate: createWorkExperienceDto.endDate
        ? new Date(createWorkExperienceDto.endDate)
        : null,
    });

    return workExperience;
  }

  async updateWorkExperience(
    userId: number,
    experienceId: number,
    updateWorkExperienceDto: UpdateWorkExperienceDto,
  ) {
    await this.findOneStaff(userId); // Verify staff exists

    const workExperience = await this.workExperienceRepository.findOne({
      where: { id: experienceId, userId },
    });

    if (!workExperience) {
      throw new NotFoundException('Work experience entry not found');
    }

    const updateData: any = { ...updateWorkExperienceDto };
    if (updateWorkExperienceDto.effectiveDate) {
      updateData.effectiveDate = new Date(updateWorkExperienceDto.effectiveDate);
    }
    if (updateWorkExperienceDto.endDate !== undefined) {
      updateData.endDate = updateWorkExperienceDto.endDate
        ? new Date(updateWorkExperienceDto.endDate)
        : null;
    }

    await workExperience.update(updateData);
    return workExperience;
  }

  async deleteWorkExperience(userId: number, experienceId: number) {
    await this.findOneStaff(userId); // Verify staff exists

    const workExperience = await this.workExperienceRepository.findOne({
      where: { id: experienceId, userId },
    });

    if (!workExperience) {
      throw new NotFoundException('Work experience entry not found');
    }

    await workExperience.destroy();

    return {
      message: 'Work experience entry has been removed successfully',
    };
  }

  async uploadProfilePicture(id: number, profileImageUrl: string) {
    const staff = await this.userRepository.findOne({
      where: {
        id,
        role: UserRole.STAFF,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    // Delete old profile picture if it exists
    if (staff.profileImageUrl) {
      const oldImagePath = staff.profileImageUrl.replace('/uploads/', './uploads/');
      const fullPath = join(process.cwd(), oldImagePath);
      
      if (existsSync(fullPath)) {
        try {
          unlinkSync(fullPath);
        } catch (error) {
          // Log error but don't fail the upload if deletion fails
          console.error('Failed to delete old profile picture:', error);
        }
      }
    }

    // Update profile picture URL
    await staff.update({ profileImageUrl });

    // Return updated staff without password
    const { password, ...staffWithoutPassword } = staff.toJSON();
    return staffWithoutPassword;
  }
}

