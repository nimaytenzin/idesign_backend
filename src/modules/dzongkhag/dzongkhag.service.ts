import { Inject, Injectable } from '@nestjs/common';
import { Dzongkhag } from './entities/dzongkhag.entity';
import { CreateDzongkhagDto } from './dto/create-dzongkhag.dto';
import { UpdateDzongkhagDto } from './dto/update-dzongkhag.dto';
import { CreateDzongkhagGeoJsonDto } from './dto/create-dzongkhag-geojson.dto';
import { instanceToPlain } from 'class-transformer';
import { Sequelize, QueryTypes } from 'sequelize';

@Injectable()
export class DzongkhagService {
  constructor(
    @Inject('DZONGKHAG_REPOSITORY')
    private readonly dzongkhagRepository: typeof Dzongkhag,
  ) {}

  async create(createDzongkhagDto: CreateDzongkhagDto): Promise<Dzongkhag> {
    return await this.dzongkhagRepository.create(
      instanceToPlain(createDzongkhagDto),
    );
  }

  async createFromGeoJson(
    geoJsonDto: CreateDzongkhagGeoJsonDto,
  ): Promise<Dzongkhag> {
    const { properties, geometry } = geoJsonDto;

    // Convert GeoJSON geometry to PostGIS format
    const geomString = JSON.stringify(geometry);

    const dzongkhag = await this.dzongkhagRepository.create({
      name: properties.name,
      areaCode: properties.areaCode,
      geom: Sequelize.fn('ST_GeomFromGeoJSON', geomString),
    });

    return dzongkhag;
  }

  async findAll(): Promise<Dzongkhag[]> {
    return await this.dzongkhagRepository.findAll<Dzongkhag>({
      include: ['administrativeZones'],
    });
  }

  async findAllAsGeoJson(): Promise<any> {
    const data: any = await this.dzongkhagRepository.sequelize.query(
      `SELECT jsonb_build_object(
        'type',     'FeatureCollection',
        'features', jsonb_agg(features.feature)
      )
      FROM (
        SELECT jsonb_build_object(
          'type',       'Feature',
          'id',         inputs.id,
          'geometry',   ST_AsGeoJSON(geom)::jsonb,
          'properties', to_jsonb(inputs) - 'geom'
        ) AS feature
        FROM (SELECT * FROM "Dzongkhags" ORDER BY id) inputs
      ) features;`,
    );

    return data[0][0].jsonb_build_object;
  }

  async findOne(id: number): Promise<Dzongkhag> {
    return await this.dzongkhagRepository.findOne<Dzongkhag>({
      where: { id },
      attributes: { exclude: ['geom'] },
    });
  }

  async update(id: number, updateDzongkhagDto: UpdateDzongkhagDto) {
    const [numRows, updatedRows] = await this.dzongkhagRepository.update(
      instanceToPlain(updateDzongkhagDto),
      {
        where: { id },
        returning: true,
      },
    );

    if (numRows === 0) {
      throw new Error(`Dzongkhag with ID ${id} not found`);
    }

    return this.findOne(id);
  }

  async updateGeometry(id: number, geometry: any): Promise<Dzongkhag> {
    // First check if the dzongkhag exists
    const dzongkhag = await this.dzongkhagRepository.findByPk(id);
    if (!dzongkhag) {
      throw new Error(`Dzongkhag with ID ${id} not found`);
    }

    // Convert GeoJSON geometry to PostGIS format
    const geomString = JSON.stringify(geometry);

    await this.dzongkhagRepository.update(
      {
        geom: Sequelize.fn('ST_GeomFromGeoJSON', geomString),
      },
      {
        where: { id },
      },
    );

    return this.findOne(id);
  }

  async remove(id: number): Promise<number> {
    return await this.dzongkhagRepository.destroy({
      where: { id },
    });
  }
}
