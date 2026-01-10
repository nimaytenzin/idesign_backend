import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { User, UserRole } from '../modules/auth/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DatabaseSeedService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeedService.name);

  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: typeof User,
  ) {}

  async onModuleInit() {
    await this.createDefaultAdmin();
  }

  /**
   * Create a default admin user if one doesn't exist
   * Only creates admin if all required environment variables are set:
   * - DEFAULT_ADMIN_NAME (required)
   * - DEFAULT_ADMIN_CID (required)
   * - DEFAULT_ADMIN_EMAIL (required)
   * - DEFAULT_ADMIN_PASSWORD (required)
   * - DEFAULT_ADMIN_PHONE (optional)
   */
  private async createDefaultAdmin() {
    try {
      // Check if admin user already exists
      const existingAdmin = await this.userRepository.findOne({
        where: {
          role: UserRole.ADMIN,
        },
      });

      if (existingAdmin) {
        this.logger.log('Admin user already exists. Skipping creation.');
        return;
      }

      // Check if all required environment variables are set
      const requiredEnvVars = {
        DEFAULT_ADMIN_NAME: process.env.DEFAULT_ADMIN_NAME,
        DEFAULT_ADMIN_CID: process.env.DEFAULT_ADMIN_CID,
        DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL,
        DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD,
      };

      // Check if any required env var is missing
      const missingVars = Object.entries(requiredEnvVars)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missingVars.length > 0) {
        this.logger.log('========================================');
        this.logger.log('Skipping admin user creation.');
        this.logger.log('Required environment variables not set:');
        missingVars.forEach((varName) => {
          this.logger.log(`  - ${varName}`);
        });
        this.logger.log('========================================');
        return;
      }

      // Default admin credentials from environment variables
      const defaultAdmin = {
        name: requiredEnvVars.DEFAULT_ADMIN_NAME!,
        cid: requiredEnvVars.DEFAULT_ADMIN_CID!,
        emailAddress: requiredEnvVars.DEFAULT_ADMIN_EMAIL!,
        phoneNumber: process.env.DEFAULT_ADMIN_PHONE || null,
        password: requiredEnvVars.DEFAULT_ADMIN_PASSWORD!,
        role: UserRole.ADMIN,
        isActive: true,
      };

      // Hash password
      const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);

      // Create admin user
      const admin = await this.userRepository.create({
        ...defaultAdmin,
        password: hashedPassword,
      });

      this.logger.log('========================================');
      this.logger.log('Default Admin User Created Successfully!');
      this.logger.log('========================================');
      this.logger.log(`Email: ${defaultAdmin.emailAddress}`);
      this.logger.log(`CID: ${defaultAdmin.cid}`);
      this.logger.log(`Password: ${defaultAdmin.password}`);
      this.logger.log('========================================');
      this.logger.warn('⚠️  IMPORTANT: Change the default password after first login!');
      this.logger.log('========================================');
    } catch (error) {
      this.logger.error('Failed to create default admin user:', error.message);
      // Don't throw error to prevent app from crashing
      // Admin can be created manually if needed
    }
  }
}
