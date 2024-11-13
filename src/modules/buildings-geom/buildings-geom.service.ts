import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
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

  async findBuildingsByBuildingIdCsv(plotArray: string) {
    const buildingIdArray = plotArray.split(',');

    let multiGeom = {
      type: 'FeatureCollection',
      features: [],
    };

    console.log(buildingIdArray);
    for (let buildingId of buildingIdArray) {
      try {
        let buildingGeom = await this.buildingGeomRepository.findOne({
          where: {
            zhicharBuildingId: Number(buildingId),
          },
        });

        if (buildingGeom) {
          multiGeom.features.push({
            type: 'Feature',
            geometry: buildingGeom.geom,
            properties: {
              zhicharBuildingId: buildingGeom.zhicharBuildingId,
              id: buildingGeom.id,
            },
          });
        } else {
          console.warn(
            `Building Geometry not found for Building: ${buildingId}`,
          );
        }
      } catch (error) {
        console.error(
          `Error fetching geometry for building ID ${buildingId}:`,
          error,
        );
        // Optionally handle specific errors if needed
      }
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
          zhicharBuildingId: buildingGeom.zhicharBuildingId,
          id: buildingGeom.id,
        },
      });
    }

    return multiGeom;
  }
}
