import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AffiliateProfileService } from './affiliate-profile.service';
import { AffiliateProfileController } from './affiliate-profile.controller';
import { AffiliateProfile } from './entities/affiliate-profile.entity';
import { User } from '../../auth/entities/user.entity';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      AffiliateProfile,
      User,
    ]),
    AuthModule,
  ],
  controllers: [AffiliateProfileController],
  providers: [AffiliateProfileService],
  exports: [AffiliateProfileService],
})
export class AffiliateProfileModule {}
