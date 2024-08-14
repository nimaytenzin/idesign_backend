import { Test, TestingModule } from '@nestjs/testing';
import { BuildingsGeomController } from './buildings-geom.controller';
import { BuildingsGeomService } from './buildings-geom.service';

describe('BuildingsGeomController', () => {
  let controller: BuildingsGeomController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BuildingsGeomController],
      providers: [BuildingsGeomService],
    }).compile();

    controller = module.get<BuildingsGeomController>(BuildingsGeomController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
