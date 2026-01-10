import {
  IsEnum,
  IsNumber,
  IsInt,
  Min,
} from 'class-validator';
import { TransportMode } from '../entities/delivery.enums';

export class CreateDeliveryRateDto {
  @IsInt()
  @Min(1)
  deliveryLocationId: number;

  @IsEnum(TransportMode)
  transportMode: TransportMode;

  @IsNumber()
  @Min(0)
  rate: number;
}
