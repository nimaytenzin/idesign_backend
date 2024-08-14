import { PartialType } from '@nestjs/mapped-types';
import { CreateBuildingsGeomDto } from './create-buildings-geom.dto';

export class UpdateBuildingsGeomDto extends PartialType(CreateBuildingsGeomDto) {}
