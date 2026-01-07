import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { FulfillmentStatus } from '../entities/order.enums';

export class UpdateFulfillmentStatusDto {
  @IsEnum(FulfillmentStatus)
  @IsNotEmpty()
  fulfillmentStatus: FulfillmentStatus;

  @IsString()
  @IsOptional()
  internalNotes?: string;

  // Driver information (required when status is SHIPPING)
  @IsString()
  @IsOptional()
  driverName?: string;

  @IsString()
  @IsOptional()
  driverPhone?: string;

  @IsString()
  @IsOptional()
  vehicleNumber?: string;
}

