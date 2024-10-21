import { Module } from '@nestjs/common';
import { PlotsGeomService } from './plots-geom.service';
import { PlotGeom } from './entities/plots-geom.entity';

@Module({
  providers: [
    PlotsGeomService,
    {
      provide: 'PLOTGEOM_REPO',
      useValue: PlotGeom,
    },
  ],
  exports: [PlotsGeomService],
})
export class PlotsGeomModule {}
