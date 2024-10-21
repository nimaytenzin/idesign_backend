import { Inject, Injectable } from '@nestjs/common';
import { CreateBuildingsGeomDto } from './dto/create-buildings-geom.dto';
import { UpdateBuildingsGeomDto } from './dto/update-buildings-geom.dto';
import { BuildingsGeom } from './entities/buildings-geom.entity';
import { geoJson } from 'src/constants/constants';

@Injectable()
export class BuildingsGeomService {
  constructor(
    @Inject('BUILDINGGEOM_REPOSITORY')
    private readonly buildingGeomRepository: typeof BuildingsGeom,
  ) {}

  async findPlotsByBuildingIDArray(buildingIdCSVString: string) {
    const buildingIdArray = buildingIdCSVString.split(',');

    let multiGeom = {
      type: 'FeatureCollection',
      features: [],
    };

    for (let buildingId of buildingIdArray) {
      let buildingGeom = await this.buildingGeomRepository.findOne({
        where: {
          buildingId: buildingId,
        },
      });

      multiGeom.features.push({
        type: 'Feature',
        geometry: buildingGeom.geom,
        properties: {
          buildingId: buildingGeom.buildingId,
          id: buildingGeom.id,
        },
      });
    }

    return multiGeom;
  }

  async findAllBuildings() {
    let multiGeom = {
      type: 'FeatureCollection',
      features: [],
    };

    let buildingGeoms = await this.buildingGeomRepository.findAll();

    for (let buildingGeom of buildingGeoms) {
      multiGeom.features.push({
        type: 'Feature',
        geometry: buildingGeom.geom,
        properties: {
          buildingId: buildingGeom.buildingId,
          id: buildingGeom.id,
        },
      });
    }

    return multiGeom;
  }
}
