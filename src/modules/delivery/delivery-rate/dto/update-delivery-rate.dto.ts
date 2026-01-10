import {
  IsEnum,
  IsNumber,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';
import { TransportMode } from '../entities/delivery.enums';

export class UpdateDeliveryRateDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  deliveryLocationId?: number;

  @IsOptional()
  @IsEnum(TransportMode)
  transportMode?: TransportMode;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;
}
