import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

/**
 * DTO for shipping an order
 * Updates delivery driver information and estimated delivery date
 */
export class ShipOrderDto {
  @IsString()
  @IsNotEmpty()
  driverName: string;

  @IsString()
  @IsOptional()
  driverPhone?: string;

  @IsString()
  @IsNotEmpty()
  vehicleNumber: string;

  @IsDateString()
  @IsNotEmpty()
  expectedDeliveryDate: string;


}
