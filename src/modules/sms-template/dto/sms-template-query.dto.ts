import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { SmsTriggerEvent } from '../entities/sms-template.entity';
import { OrderType } from '../../order/entities/order.enums';

export class SmsTemplateQueryDto {
  @IsEnum(SmsTriggerEvent)
  @IsOptional()
  triggerEvent?: SmsTriggerEvent;

  @IsEnum(OrderType)
  @IsOptional()
  orderType?: OrderType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

