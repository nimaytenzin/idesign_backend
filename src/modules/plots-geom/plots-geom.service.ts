import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreatePlotsGeomDto } from './dto/create-plots-geom.dto';
import { UpdatePlotsGeomDto } from './dto/update-plots-geom.dto';
import { PlotGeom } from './entities/plots-geom.entity';

@Injectable()
export class PlotsGeomService {
  constructor(
    @Inject('PLOTGEOM_REPO')
    private readonly plotsGeomRepository: typeof PlotGeom,
  ) {}

  async findPlotsByPlotIDCSV(plotArray: string) {
    const plotIdArray = plotArray.split(',');

    let multiGeom = {
      type: 'FeatureCollection',
      features: [],
    };

    for (let plotId of plotIdArray) {
      try {
        let plotGeom = await this.plotsGeomRepository.findOne({
          where: {
            plotId: plotId,
          },
        });

        if (plotGeom) {
          multiGeom.features.push({
            type: 'Feature',
            geometry: plotGeom.geom,
            properties: {
              plotId: plotGeom.plotId,
              id: plotGeom.id,
            },
          });
        } else {
          console.warn(`Plot Geometry not found for plotId: ${plotId}`);
        }
      } catch (error) {
        console.error(`Error fetching geometry for plotId ${plotId}:`, error);
        // Optionally handle specific errors if needed
      }
    }

    return multiGeom;
  }

  async findAllPlots() {
    let multiGeom = {
      type: 'FeatureCollection',
      features: [],
    };

    let plotGeoms = await this.plotsGeomRepository.findAll();

    for (let plotGeom of plotGeoms) {
      multiGeom.features.push({
        type: 'Feature',
        geometry: plotGeom.geom,
        properties: {
          plotId: plotGeom.plotId,
          id: plotGeom.id,
        },
      });
    }

    return multiGeom;
  }
}
