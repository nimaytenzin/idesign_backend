import { Module } from '@nestjs/common';
import { BuildingsGeomService } from './buildings-geom.service';
import { BuildingsGeomController } from './buildings-geom.controller';

@Module({
  controllers: [BuildingsGeomController],
  providers: [BuildingsGeomService]
})
export class BuildingsGeomModule {}
