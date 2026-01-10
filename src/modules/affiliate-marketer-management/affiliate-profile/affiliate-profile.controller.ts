import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AffiliateProfileService } from './affiliate-profile.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../auth/entities/user.entity';
import { CreateAffiliateMarketerDto } from './dto/create-affiliate-marketer.dto';
import { AffiliateMarketerResponseDto } from './dto/affiliate-marketer-response.dto';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

@Controller('affiliate-marketer')
export class AffiliateProfileController {
  constructor(private readonly affiliateProfileService: AffiliateProfileService) {}

  @Post()
  async createAffiliateMarketer(
    @Body() createDto: CreateAffiliateMarketerDto,
  ) {
    return this.affiliateProfileService.createAffiliateMarketer(createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllAffiliateMarketers(): Promise<AffiliateMarketerResponseDto[]> {
    return this.affiliateProfileService.getAllAffiliateMarketers();
  }
}
