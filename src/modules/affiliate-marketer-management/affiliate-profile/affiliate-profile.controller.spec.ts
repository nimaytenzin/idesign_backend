import { Test, TestingModule } from '@nestjs/testing';
import { AffiliateProfileController } from './affiliate-profile.controller';
import { AffiliateProfileService } from './affiliate-profile.service';

describe('AffiliateProfileController', () => {
  let controller: AffiliateProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AffiliateProfileController],
      providers: [AffiliateProfileService],
    }).compile();

    controller = module.get<AffiliateProfileController>(AffiliateProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
