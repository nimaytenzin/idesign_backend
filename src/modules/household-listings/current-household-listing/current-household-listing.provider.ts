import { CurrentHouseholdListing } from './entities/current-household-listing.entity';

export const currentHouseholdListingProviders = [
  {
    provide: 'CURRENT_HOUSEHOLD_LISTING_REPOSITORY',
    useValue: CurrentHouseholdListing,
  },
];
