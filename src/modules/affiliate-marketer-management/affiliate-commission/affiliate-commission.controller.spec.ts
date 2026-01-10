import { Test, TestingModule } from '@nestjs/testing';
import { AffiliateCommissionController } from './affiliate-commission.controller';
import { AffiliateCommissionService } from './affiliate-commission.service';

describe('AffiliateCommissionController', () => {
  let controller: AffiliateCommissionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AffiliateCommissionController],
      providers: [AffiliateCommissionService],
    }).compile();

    controller = module.get<AffiliateCommissionController>(AffiliateCommissionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
