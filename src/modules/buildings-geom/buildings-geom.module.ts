import { Module } from '@nestjs/common';
import { BuildingsGeomService } from './buildings-geom.service';
import { BuildingsGeom } from './entities/buildings-geom.entity';

@Module({
  providers: [
    BuildingsGeomService,
    { provide: 'BUILDINGGEOM_REPOSITORY', useValue: BuildingsGeom },
  ],
  exports: [BuildingsGeomService],
})
export class BuildingsGeomModule {}
