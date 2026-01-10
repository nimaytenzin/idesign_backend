import { PartialType } from '@nestjs/mapped-types';
import { CreateAffiliateCommissionDto } from './create-affiliate-commission.dto';

export class UpdateAffiliateCommissionDto extends PartialType(CreateAffiliateCommissionDto) {}
