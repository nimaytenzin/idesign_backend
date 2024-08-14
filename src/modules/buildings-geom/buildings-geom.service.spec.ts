import { Test, TestingModule } from '@nestjs/testing';
import { BuildingsGeomService } from './buildings-geom.service';

describe('BuildingsGeomService', () => {
  let service: BuildingsGeomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BuildingsGeomService],
    }).compile();

    service = module.get<BuildingsGeomService>(BuildingsGeomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
