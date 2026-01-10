import { PartialType } from '@nestjs/mapped-types';
import { CreateAffiliateProfileDto } from './create-affiliate-profile.dto';

export class UpdateAffiliateProfileDto extends PartialType(CreateAffiliateProfileDto) {}
