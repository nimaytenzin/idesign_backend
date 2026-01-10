import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { SmsTriggerEvent } from '../entities/sms-template.entity';
import { OrderSource } from '../../order/entities/order.enums';

export class CreateSmsTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(SmsTriggerEvent)
  @IsNotEmpty()
  triggerEvent: SmsTriggerEvent;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  sendCount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sendDelay?: number;

  @IsEnum(OrderSource)
  @IsOptional()
  orderSource?: OrderSource | null;

  @IsNumber()
  @IsOptional()
  priority?: number;
}

