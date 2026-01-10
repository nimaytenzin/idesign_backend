import { IsString, IsEnum, IsOptional } from 'class-validator';
import { LocationType } from '../entities/delivery.enums';

export class UpdateDeliveryLocationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(LocationType)
  type?: LocationType;
}
