import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { PlotsGeomService } from './modules/plots-geom/plots-geom.service';
import { BuildingsGeomService } from './modules/buildings-geom/buildings-geom.service';

@Controller('geom')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly plotsGeomService: PlotsGeomService,
    private readonly builingGeomService: BuildingsGeomService,
  ) {}

  @Get('plots/:plotId')
  findOnePlot(@Param('plotId') id: string) {
    return this.plotsGeomService.findPlotsByPlotIDCSV(id);
  }
  @Get('plots')
  findAllPlots() {
    return this.plotsGeomService.findAllPlots();
  }

  @Get('buildings/:buildingId')
  findOneBuilding(@Param('buildingId') buildingIdCSV: string) {
    return this.builingGeomService.findPlotsByBuildingIDArray(buildingIdCSV);
  }
  @Get('buildings')
  findAllBuildings() {
    return this.builingGeomService.findAllBuildings();
  }
}
