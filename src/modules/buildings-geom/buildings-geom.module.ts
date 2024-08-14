import { Module } from '@nestjs/common';
import { BuildingsGeomService } from './buildings-geom.service';
import { BuildingsGeomController } from './buildings-geom.controller';
import { BuildingsGeom } from './entities/buildings-geom.entity';

@Module({
  controllers: [BuildingsGeomController],
  providers: [
    BuildingsGeomService,
    { provide: 'BUILDINGGEOM_REPOSITORY', useValue: BuildingsGeom},
  ]
})
export class BuildingsGeomModule { }
