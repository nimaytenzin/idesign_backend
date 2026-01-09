import {
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { DeliveryMethod, DeliveryLocation } from '../entities/delivery.enums';

export class UpdateDeliveryRateDto {
  @IsOptional()
  @IsEnum(DeliveryLocation)
  location?: DeliveryLocation;

  @IsOptional()
  @IsEnum(DeliveryMethod)
  deliveryMethod?: DeliveryMethod;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;
}

