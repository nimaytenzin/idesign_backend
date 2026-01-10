import { Test, TestingModule } from '@nestjs/testing';
import { AffiliateCommissionService } from './affiliate-commission.service';

describe('AffiliateCommissionService', () => {
  let service: AffiliateCommissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AffiliateCommissionService],
    }).compile();

    service = module.get<AffiliateCommissionService>(AffiliateCommissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
