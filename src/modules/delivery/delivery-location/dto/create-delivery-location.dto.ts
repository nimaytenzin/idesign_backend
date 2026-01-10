import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { LocationType } from '../entities/delivery.enums';

export class CreateDeliveryLocationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(LocationType)
  @IsNotEmpty()
  type: LocationType;
}
