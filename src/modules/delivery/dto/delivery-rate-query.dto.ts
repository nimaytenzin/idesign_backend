import { IsEnum, IsOptional } from 'class-validator';
import { DeliveryMethod, DeliveryLocation } from '../entities/delivery.enums';

export class DeliveryRateQueryDto {
  @IsOptional()
  @IsEnum(DeliveryLocation)
  location?: DeliveryLocation;

  @IsOptional()
  @IsEnum(DeliveryMethod)
  deliveryMethod?: DeliveryMethod;
}

