import {
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';
import { DeliveryMethod, DeliveryLocation } from '../entities/delivery.enums';

export class CreateDeliveryRateDto {
  @IsEnum(DeliveryLocation)
  location: DeliveryLocation;

  @IsEnum(DeliveryMethod)
  deliveryMethod: DeliveryMethod;

  @IsNumber()
  @Min(0)
  rate: number;
}

