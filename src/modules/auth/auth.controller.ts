import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  HttpCode,
  HttpStatus,
  Delete,
  Put,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Multer } from 'multer';
import { extname } from 'path';
import { AuthService } from './auth.service';
 import { LoginDto } from './dto/login.dto';
 import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserDetailsDto } from './dto/update-user-details.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User, UserRole } from './entities/user.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { PaginatedResponseDto } from 'src/common/pagination/dto/paginated-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ============================================
  // ADMIN ONLY ENDPOINTS
  // ============================================

  /**
   * 1. Create User (create admin, staff or affiliate marketer using one endpoint) - Admin Only
   */
  @Post('user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.createUser(createUserDto);
  }

  /**
   * 2 & 5. Delete User (delete admin, staff or affiliate marketer using one endpoint) - Admin Only
   */
  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.authService.deleteUser(id);
  }

  /**
   * 3. Reset Password - Admin Only
   */
  @Post('users/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async adminResetPassword(@Body() adminResetPasswordDto: AdminResetPasswordDto) {
    return this.authService.adminResetPassword(adminResetPasswordDto);
  }

  /**
   * 4. Get All Users paginated by role (admin, staff or affiliate marketer) - Admin Only
   */
  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllUsers(@Query() queryDto: GetUsersQueryDto): Promise<PaginatedResponseDto<User>> {
    console.log(queryDto);
    return this.authService.getAllUsersPaginated(queryDto);
  }

  /**
   * 6. Update User (update admin, staff or affiliate marketer using one endpoint - update all fields) - Admin Only
   */
  @Put('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.authService.updateUser(id, updateUserDto);
  }

  // ============================================
  // USER ENDPOINTS (Admin, Staff, Affiliate Marketer)
  // ============================================

  /**
   * 7. Get User Details using JWT token - Admin, Staff and Affiliate Marketer
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Request() req) {
    return this.authService.getCurrentUser(req.user.id);
  }

  /**
   * 8. Change Password - Admin, Staff and Affiliate Marketer
   */
  @Patch('me/change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }

  /**
   * 9. Update User Details (name, email, phone number etc except role and isActive and password) - Admin, Staff and Affiliate Marketer
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateUserDetails(
    @Request() req,
    @Body() updateUserDetailsDto: UpdateUserDetailsDto,
  ) {
    return this.authService.updateUserDetails(req.user.id, updateUserDetailsDto);
  }

  /**
   * 10. Upload Profile Picture - Admin, Staff and Affiliate Marketer
   * 
  
   */
  @Post('upload-profile-picture')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      storage: diskStorage({
        destination: './uploads/user-profiles',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `profile-picture-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadProfilePicture(
    @Request() req,
    @Query('userId') userIdParam?: string,
    @UploadedFile() file?: Multer.File,
  ) {
    // Determine target user ID
    let targetUserId: number;
    
    if (userIdParam !== undefined && userIdParam !== null && userIdParam !== '') {
      // Parse userId from query parameter
      const userId = parseInt(userIdParam, 10);
      
      if (isNaN(userId)) {
        throw new BadRequestException('Invalid userId parameter');
      }
      
      // Admin can upload for any user
      if (req.user.role === UserRole.ADMIN) {
        targetUserId = userId;
      } else {
        // Non-admin users can only upload their own profile picture
        throw new BadRequestException('You can only upload profile picture for yourself');
      }
    } else {
      // No userId provided, upload for current user
      targetUserId = req.user.id;
    }

    return this.authService.uploadProfilePicture(targetUserId, file);
  }
}
