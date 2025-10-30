import { Module } from '@nestjs/common';
import { CurrentHouseholdListingService } from './current-household-listing.service';
import { CurrentHouseholdListingController } from './current-household-listing.controller';
import { currentHouseholdListingProviders } from './current-household-listing.provider';
import { DatabaseModule } from '../../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CurrentHouseholdListingController],
  providers: [
    CurrentHouseholdListingService,
    ...currentHouseholdListingProviders,
  ],
  exports: [CurrentHouseholdListingService],
})
export class CurrentHouseholdListingModule {}
