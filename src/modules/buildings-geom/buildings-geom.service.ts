import { Inject, Injectable } from '@nestjs/common';
import { CreateBuildingsGeomDto } from './dto/create-buildings-geom.dto';
import { UpdateBuildingsGeomDto } from './dto/update-buildings-geom.dto';
import { BuildingsGeom } from './entities/buildings-geom.entity';

@Injectable()
export class BuildingsGeomService {
  constructor(
    @Inject('BUILDINGGEOM_REPOSITORY')
    private readonly buildingGeomRepository: typeof BuildingsGeom,
  ) { }

  async create(createBuildingsGeomDto: CreateBuildingsGeomDto) {
    const result = await this.buildingGeomRepository.sequelize.query(
      `INSERT INTO "BuildingsGeoms" ("buildingId","geom") values (
        ${createBuildingsGeomDto.buildingId},
        ST_GeomFromGeoJSON( '${createBuildingsGeomDto.geom}')
      );`
    )
    return result
  }

  findAll() {
    return `This action returns all buildingsGeom`;
  }

  async findOneByBuildingId(id: number) {
    const data: any = await this.buildingGeomRepository.sequelize.query(
      `SELECT jsonb_build_object(
      'type',     'FeatureCollection',
      'features', jsonb_agg(features.feature)
    )
    FROM (
      SELECT jsonb_build_object(
        'type',       'Feature',
        'geometry',   ST_AsGeoJSON(geom)::jsonb,
        'properties', to_jsonb(inputs) - 'geom'
      ) AS feature
      FROM (SELECT * FROM "BuildingsGeoms" where "buildingId" = ${id}) inputs) features;`,
    );

    const featureCollection = data[0][0];

    return featureCollection.jsonb_build_object;
  }

  async updateByBuildingId(id: number, updateBuildingsGeomDto: UpdateBuildingsGeomDto) {
    const result = await this.buildingGeomRepository.sequelize.query(
      `UPDATE "BuildingsGeoms" SET "geom" = ST_GeomFromGeoJSON( '${updateBuildingsGeomDto.geom}') where "buildingId" = ${id}`
    )
    return result
  }

  async remove(id: number) {
    const data: any = await this.buildingGeomRepository.sequelize.query(
      `Delete FROM "BuildingsGeoms" where "buildingId" = '${id}'`,
    );
    return data;
  }
}
