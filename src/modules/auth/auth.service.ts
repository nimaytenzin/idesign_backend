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
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class AuthService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: typeof User,
    private readonly jwtService: JwtService,
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
