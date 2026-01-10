import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../auth/entities/user.entity';
import { CreateAffiliateMarketerDto } from './dto/create-affiliate-marketer.dto';
import { AffiliateMarketerResponseDto } from './dto/affiliate-marketer-response.dto';
import { AffiliateProfile } from './entities/affiliate-profile.entity';

@Injectable()
export class AffiliateProfileService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(AffiliateProfile)
    private affiliateProfileModel: typeof AffiliateProfile,
  ) {}

  async createAffiliateMarketer(
    createDto: CreateAffiliateMarketerDto,
  ): Promise<User> {
    // Check if user already exists by CID
    const existingUserByCid = await this.userModel.findOne({
      where: { cid: createDto.cid },
    });

    if (existingUserByCid) {
      throw new ConflictException('User with this CID already exists');
    }

    // Check if user already exists by email
    const existingUserByEmail = await this.userModel.findOne({
      where: { emailAddress: createDto.email },
    });

    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if voucher code is already taken
    const existingVoucherCode = await this.affiliateProfileModel.findOne({
      where: { voucherCode: createDto.voucherCode },
    });

    if (existingVoucherCode) {
      throw new ConflictException('Voucher code is already taken');
    }

    // Validate percentages
    if (createDto.discountPercentage < 0 || createDto.discountPercentage > 100) {
      throw new BadRequestException('Discount percentage must be between 0 and 100');
    }

    if (createDto.commissionPercentage < 0 || createDto.commissionPercentage > 100) {
      throw new BadRequestException('Commission percentage must be between 0 and 100');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createDto.password, 10);

    // Create affiliate marketer user
    const user = await this.userModel.create({
      name: createDto.name,
      cid: createDto.cid,
      emailAddress: createDto.email,
      phoneNumber: createDto.phoneNumber,
      password: hashedPassword,
      role: UserRole.AFFILIATE_MARKETER,
      isActive: true,
    });

    // Create affiliate profile
    await this.affiliateProfileModel.create({
      userId: user.id,
      voucherCode: createDto.voucherCode,
      discountPercentage: createDto.discountPercentage,
      commissionPercentage: createDto.commissionPercentage,
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword as User;
  }

  async getAllAffiliateMarketers(): Promise<AffiliateMarketerResponseDto[]> {
    const affiliateMarketers = await this.userModel.findAll({
      where: {
        role: UserRole.AFFILIATE_MARKETER,
      },
      include: [
        {
          model: AffiliateProfile,
          as: 'affiliateProfile',
          required: false, // Left join - include users even if they don't have a profile yet
        },
      ],
      attributes: [
        'id',
        'name',
        'cid',
        'emailAddress',
        'phoneNumber',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
      order: [['createdAt', 'DESC']],
    });

    return affiliateMarketers.map((user) => ({
      id: user.id,
      name: user.name,
      cid: user.cid,
      emailAddress: user.emailAddress,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
      voucherCode: user.affiliateProfile?.voucherCode || null,
      discountPercentage: user.affiliateProfile?.discountPercentage
        ? parseFloat(user.affiliateProfile.discountPercentage.toString())
        : null,
      commissionPercentage: user.affiliateProfile?.commissionPercentage
        ? parseFloat(user.affiliateProfile.commissionPercentage.toString())
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }
}
