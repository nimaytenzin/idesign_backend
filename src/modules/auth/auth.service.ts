import {
  Inject,
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import type { Multer } from 'multer';
import { User, UserRole } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserDetailsDto } from './dto/update-user-details.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { NotFoundException } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Op } from 'sequelize';
import { PaginationService } from '../../common/pagination/pagination.service';
import { EmployeeProfile } from '../employee-management/employee-profile/entities/employee-profile.entity';
import { EmployeeEducation } from '../employee-management/employee-education/entities/employee-education.entity';
import { EmployeeWorkExperience } from '../employee-management/employee-work-experience/entities/employee-work-experience.entity';
import { AffiliateProfile } from '../affiliate-marketer-management/affiliate-profile/entities/affiliate-profile.entity';

@Injectable()
export class AuthService {
  private readonly ALLOWED_IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: typeof User,
    private readonly jwtService: JwtService,
    private readonly paginationService: PaginationService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUserByCid = await this.userRepository.findOne({
      where: { cid: registerDto.cid },
    });

    if (existingUserByCid) {
      throw new ConflictException('User with this CID already exists');
    }

    const existingUserByEmail = await this.userRepository.findOne({
      where: { emailAddress: registerDto.emailAddress },
    });

    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = await this.userRepository.create({
      ...instanceToPlain(registerDto),
      password: hashedPassword,
    });

    // Generate JWT token
    const token = this.generateToken(user);

    // Remove password from response
    const { password, ...userWithoutPassword } = user.toJSON();

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async login(loginDto: LoginDto) {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { emailAddress: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    // Remove password from response
    const { password, ...userWithoutPassword } = user.toJSON();

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetPasswordDto.token)
      .digest('hex');

    const user = await this.userRepository.findOne({
      where: {
        resetPasswordToken: hashedToken,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = null;

    await user.save();

    return {
      message: 'Password has been reset successfully',
    };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.userRepository.findByPk(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    return {
      message: 'Password changed successfully',
    };
  }

  async validateUser(userId: number) {
    const user = await this.userRepository.findByPk(userId);

    if (!user) {
      return null;
    }

    const { password, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }

  async getUserById(userId: number) {
    const user = await this.userRepository.findByPk(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const { password, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }

  /**
   * Create a new admin user
   * @param createAdminDto - Admin creation data
   * @returns Created admin user (without password)
   */
  async createAdmin(createAdminDto: CreateAdminDto) {
    // Check if user already exists
    const existingUserByCid = await this.userRepository.findOne({
      where: { cid: createAdminDto.cid },
    });

    if (existingUserByCid) {
      throw new ConflictException('User with this CID already exists');
    }

    const existingUserByEmail = await this.userRepository.findOne({
      where: { emailAddress: createAdminDto.emailAddress },
    });

    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);

    // Create admin user with ADMIN role
    const admin = await this.userRepository.create({
      ...instanceToPlain(createAdminDto),
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    // Remove password from response
    const { password, ...adminWithoutPassword } = admin.toJSON();

    return adminWithoutPassword;
  }

  /**
   * Get all admin users
   * @returns Array of admin users (without passwords)
   */
  async getAllAdmins() {
    const admins = await this.userRepository.findAll({
      where: { role: UserRole.ADMIN },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });

    return admins.map((admin) => admin.toJSON());
  }

  /**
   * 1. Create User (create admin, staff or affiliate marketer using one endpoint) - Admin Only
   */
  async createUser(createUserDto: CreateUserDto) {
    // Check if user already exists by CID
    const existingUserByCid = await this.userRepository.findOne({
      where: { cid: createUserDto.cid },
    });

    if (existingUserByCid) {
      throw new ConflictException('User with this CID already exists');
    }

    // Check if user already exists by email
    const existingUserByEmail = await this.userRepository.findOne({
      where: { emailAddress: createUserDto.emailAddress },
    });

    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user with specified role
    const user = await this.userRepository.create({
      ...instanceToPlain(createUserDto),
      password: hashedPassword,
      role: createUserDto.role,
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user.toJSON();

    return userWithoutPassword;
  }

  /**
   * 2. Delete User - Admin Only
   */
  async deleteUser(userId: number) {
    const user = await this.userRepository.findByPk(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await user.destroy();

    return {
      message: 'User has been deleted successfully',
    };
  }

  /**
   * 3. Reset Password - Admin Only
   */
  async adminResetPassword(adminResetPasswordDto: AdminResetPasswordDto) {
    const user = await this.userRepository.findByPk(adminResetPasswordDto.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(adminResetPasswordDto.newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    return {
      message: 'Password has been reset successfully',
    };
  }

  /**
   * Get Admin and Staff users for todo assignment - Admin and Staff only
   * Returns all active admin and staff users (excludes affiliate marketers)
   */
  async getAdminAndStaffUsers(): Promise<User[]> {
    const users = await this.userRepository.findAll({
      where: {
        role: {
          [Op.in]: [UserRole.ADMIN, UserRole.STAFF],
        },
        isActive: true,
      },
      attributes: { exclude: ['password', 'resetPasswordToken'] },
      order: [['name', 'ASC']],
    });

    return users.map((user) => user.toJSON());
  }

  /**
   * 4. Get All Users paginated by role - Admin Only
   */
  async getAllUsersPaginated(queryDto: GetUsersQueryDto) {
    const { role } = queryDto;
    const { page, limit, offset } = this.paginationService.normalizePagination(queryDto);

    const where: any = {};
    if (role) {
      where.role = role;
    }

    const { count, rows } = await this.userRepository.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
     include:[
      {
        model: EmployeeProfile,
        required: false,
        include: [
          {
            model: EmployeeEducation,
            required: false,
          },
          {
            model: EmployeeWorkExperience,
            required: false,
          }
        ]
        
      },
      {
        model:AffiliateProfile,
        required: false,
      }
     ], 
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return this.paginationService.createPaginatedResponse(
      rows.map((user) => user.toJSON()),
      count,
      { page, limit },
    );
  }

  /**
   * 6. Update User (update admin, staff or affiliate marketer using one endpoint - update all fields) - Admin Only
   */
  async updateUser(userId: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findByPk(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being updated and if it conflicts with existing user
    if (updateUserDto.emailAddress && updateUserDto.emailAddress !== user.emailAddress) {
      const existingUserByEmail = await this.userRepository.findOne({
        where: { emailAddress: updateUserDto.emailAddress },
      });

      if (existingUserByEmail && existingUserByEmail.id !== userId) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Check if CID is being updated and if it conflicts with existing user
    if (updateUserDto.cid && updateUserDto.cid !== user.cid) {
      const existingUserByCid = await this.userRepository.findOne({
        where: { cid: updateUserDto.cid },
      });

      if (existingUserByCid && existingUserByCid.id !== userId) {
        throw new ConflictException('User with this CID already exists');
      }
    }

    // Update user (password is excluded - use admin reset password endpoint)
    await user.update(instanceToPlain(updateUserDto));

    // Return updated user without password
    const updatedUser = await this.userRepository.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });

    return updatedUser.toJSON();
  }

  /**
   * 7. Get User Details using JWT token - Admin, Staff and Affiliate Marketer
   */
  async getCurrentUser(userId: number) {
    const user = await this.userRepository.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.toJSON();
  }

  /**
   * 9. Update User Details (name, email, phone number etc except role and isActive and password) - Admin, Staff and Affiliate Marketer
   */
  async updateUserDetails(userId: number, updateUserDetailsDto: UpdateUserDetailsDto) {
    const user = await this.userRepository.findByPk(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being updated and if it conflicts with existing user
    if (updateUserDetailsDto.emailAddress && updateUserDetailsDto.emailAddress !== user.emailAddress) {
      const existingUserByEmail = await this.userRepository.findOne({
        where: { emailAddress: updateUserDetailsDto.emailAddress },
      });

      if (existingUserByEmail && existingUserByEmail.id !== userId) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Update user details (excluding role, isActive, password)
    await user.update(instanceToPlain(updateUserDetailsDto));

    // Return updated user without password
    const updatedUser = await this.userRepository.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });

    return updatedUser.toJSON();
  }

  /**
   * 10. Upload Profile Picture - Admin, Staff and Affiliate Marketer
   * Validates the uploaded file, handles old profile picture cleanup, and updates the user's profileImageUrl
   * @param userId - The ID of the user uploading the profile picture
   * @param file - The uploaded file from Multer
   * @returns Updated user object without password
   */
  async uploadProfilePicture(userId: number, file?: Multer.File) {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      // Validate MIME type
      if (!this.ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
        // Delete the uploaded file if MIME type is not allowed
        const filePath = path.join(process.cwd(), 'uploads', 'user-profiles', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        throw new BadRequestException(
          'Only image files are allowed! Allowed types: jpg, jpeg, png, gif, webp',
        );
      }

      const user = await this.userRepository.findByPk(userId);

      if (!user) {
        // Delete the uploaded file if user not found
        const filePath = path.join(process.cwd(), 'uploads', 'user-profiles', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        throw new NotFoundException('User not found');
      }

      // Delete old profile picture if it exists
      if (user.profileImageUrl) {
        const oldImagePath = user.profileImageUrl.replace('/uploads/', '');
        const oldFilePath = path.join(process.cwd(), oldImagePath);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (error) {
            console.error(`Failed to delete old profile picture: ${oldFilePath}`, error);
            // Continue with update even if old file deletion fails
          }
        }
      }

      // Construct the file URL
      const profileImageUrl = `/uploads/user-profiles/${file.filename}`;

      // Update profile image URL
      await user.update({ profileImageUrl });

      // Return updated user without password
      const updatedUser = await this.userRepository.findByPk(userId, {
        attributes: { exclude: ['password'] },
      });

      return updatedUser.toJSON();
    } catch (error) {
      // If error occurred and file was uploaded, clean it up
      if (file && file.filename) {
        const filePath = path.join(process.cwd(), 'uploads', 'user-profiles', file.filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (cleanupError) {
            console.error(`Failed to cleanup file: ${filePath}`, cleanupError);
          }
        }
      }
      throw error;
    }
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      cid: user.cid,
      email: user.emailAddress,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}
