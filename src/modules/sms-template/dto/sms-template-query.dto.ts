import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { SmsTriggerEvent } from '../entities/sms-template.entity';
import { OrderSource } from '../../order/entities/order.enums';

export class SmsTemplateQueryDto {
  @IsEnum(SmsTriggerEvent)
  @IsOptional()
  triggerEvent?: SmsTriggerEvent;

  @IsEnum(OrderSource)
  @IsOptional()
  orderSource?: OrderSource;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

