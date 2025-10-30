import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EnumerationAreaService } from './enumeration-area.service';
import { CreateEnumerationAreaDto } from './dto/create-enumeration-area.dto';
import { CreateEnumerationAreaGeoJsonDto } from './dto/create-enumeration-area-geojson.dto';
import { UpdateEnumerationAreaDto } from './dto/update-enumeration-area.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('enumeration-area')
export class EnumerationAreaController {
  constructor(
    private readonly enumerationAreaService: EnumerationAreaService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createEnumerationAreaDto: CreateEnumerationAreaDto) {
    return this.enumerationAreaService.create(createEnumerationAreaDto);
  }

  @Post('geojson')
  async createFromGeoJson(@Body() geoJsonDto: CreateEnumerationAreaGeoJsonDto) {
    return this.enumerationAreaService.createFromGeoJson(geoJsonDto);
  }

  @Post('bulk-upload-geojson')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype === 'application/json' ||
          file.mimetype === 'application/geo+json' ||
          file.originalname.endsWith('.geojson') ||
          file.originalname.endsWith('.json')
        ) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Invalid file type. Only .json or .geojson files are allowed.',
            ),
            false,
          );
        }
      },
    }),
  )
  async bulkUploadGeoJson(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Parse the GeoJSON file
      const geoJsonData = JSON.parse(file.buffer.toString('utf-8'));

      // Validate it's a FeatureCollection
      if (geoJsonData.type !== 'FeatureCollection') {
        throw new BadRequestException(
          'Invalid GeoJSON format. Must be a FeatureCollection.',
        );
      }

      if (!geoJsonData.features || geoJsonData.features.length === 0) {
        throw new BadRequestException(
          'FeatureCollection contains no features.',
        );
      }

      // Process the bulk upload
      const result = await this.enumerationAreaService.bulkCreateFromGeoJson(
        geoJsonData.features,
      );

      return result;
    } catch (error) {
      throw new BadRequestException(
        `Failed to process GeoJSON file: ${error.message}`,
      );
    }
  }

  @Post('upload-geojson/:enumerationAreaId')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype === 'application/json' ||
          file.mimetype === 'application/geo+json' ||
          file.originalname.endsWith('.geojson') ||
          file.originalname.endsWith('.json')
        ) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Invalid file type. Only .json or .geojson files are allowed.',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadGeoJsonFile(
    @Param('enumerationAreaId') enumerationAreaId: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Parse the GeoJSON file
      const geoJsonData = JSON.parse(file.buffer.toString('utf-8'));

      let geometry;

      // Handle different GeoJSON formats
      if (geoJsonData.type === 'Feature' && geoJsonData.geometry) {
        // Single Feature
        geometry = geoJsonData.geometry;
      } else if (
        geoJsonData.type === 'FeatureCollection' &&
        geoJsonData.features &&
        geoJsonData.features.length > 0
      ) {
        // FeatureCollection - use the first feature's geometry
        geometry = geoJsonData.features[0].geometry;
      } else if (
        geoJsonData.type &&
        [
          'Point',
          'LineString',
          'Polygon',
          'MultiPoint',
          'MultiLineString',
          'MultiPolygon',
          'GeometryCollection',
        ].includes(geoJsonData.type)
      ) {
        // Direct Geometry object
        geometry = geoJsonData;
      } else {
        throw new BadRequestException(
          'Invalid GeoJSON format. Must be a Feature, FeatureCollection, or Geometry object.',
        );
      }

      if (!geometry) {
        throw new BadRequestException(
          'No geometry found in the uploaded file.',
        );
      }

      const result = await this.enumerationAreaService.updateGeometry(
        +enumerationAreaId,
        geometry,
      );
      return result;
    } catch (error) {
      throw new BadRequestException(
        `Failed to process GeoJSON file: ${error.message}`,
      );
    }
  }

  @Get()
  async findAll(
    @Query('subAdministrativeZoneId') subAdministrativeZoneId?: string,
  ) {
    if (subAdministrativeZoneId) {
      return this.enumerationAreaService.findBySubAdministrativeZone(
        +subAdministrativeZoneId,
      );
    }
    return this.enumerationAreaService.findAll();
  }

  @Get('by-sub-administrative-zone/:subAdministrativeZoneId')
  async findBySubAdministrativeZone(
    @Param('subAdministrativeZoneId') subAdministrativeZoneId: string,
  ) {
    return this.enumerationAreaService.findBySubAdministrativeZone(
      +subAdministrativeZoneId,
    );
  }

  @Get('geojson/by-sub-administrative-zone/:subAdministrativeZoneId')
  async findAllAsGeoJsonBySubAdministrativeZone(
    @Param('subAdministrativeZoneId') subAdministrativeZoneId: string,
  ) {
    return this.enumerationAreaService.findAllAsGeoJsonBySubAdministrativeZone(
      +subAdministrativeZoneId,
    );
  }

  @Get('geojson/all')
  async findAllAsGeoJson() {
    return this.enumerationAreaService.findAllAsGeoJson();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.enumerationAreaService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateEnumerationAreaDto: UpdateEnumerationAreaDto,
  ) {
    return this.enumerationAreaService.update(+id, updateEnumerationAreaDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.enumerationAreaService.remove(+id);
  }
}
