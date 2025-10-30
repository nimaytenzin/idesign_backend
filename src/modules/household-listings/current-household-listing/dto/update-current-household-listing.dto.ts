import { PartialType } from '@nestjs/mapped-types';
import { CreateCurrentHouseholdListingDto } from './create-current-household-listing.dto';

export class UpdateCurrentHouseholdListingDto extends PartialType(CreateCurrentHouseholdListingDto) {}
