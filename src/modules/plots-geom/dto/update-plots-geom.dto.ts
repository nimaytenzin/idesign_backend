import { PartialType } from '@nestjs/mapped-types';
import { CreatePlotsGeomDto } from './create-plots-geom.dto';

export class UpdatePlotsGeomDto extends PartialType(CreatePlotsGeomDto) {}
