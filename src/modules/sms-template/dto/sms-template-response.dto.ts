import { SmsTriggerEvent } from '../entities/sms-template.entity';
import { OrderType } from '../../order/entities/order.enums';

export class SmsTemplateResponseDto {
  id: number;
  name: string;
  triggerEvent: SmsTriggerEvent;
  message: string;
  isActive: boolean;
  sendCount: number;
  sendDelay: number;
  orderType: OrderType | null;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

