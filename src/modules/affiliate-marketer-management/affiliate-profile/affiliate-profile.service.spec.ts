import { Test, TestingModule } from '@nestjs/testing';
import { AffiliateProfileService } from './affiliate-profile.service';

describe('AffiliateProfileService', () => {
  let service: AffiliateProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AffiliateProfileService],
    }).compile();

    service = module.get<AffiliateProfileService>(AffiliateProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
