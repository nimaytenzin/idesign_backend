import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SmsTemplate, SmsTriggerEvent } from '../entities/sms-template.entity';
import { Order } from '../../order/entities/order.entity';
import { OrderType } from '../../order/entities/order.enums';
import { CreateSmsTemplateDto } from '../dto/create-sms-template.dto';
import { UpdateSmsTemplateDto } from '../dto/update-sms-template.dto';
import { SmsTemplateQueryDto } from '../dto/sms-template-query.dto';
import { Op } from 'sequelize';

@Injectable()
export class SmsTemplateService {
  private readonly logger = new Logger(SmsTemplateService.name);
  private readonly placeholderRegex = /\{\{(\w+)\}\}/g;

  constructor(
    @InjectModel(SmsTemplate)
    private smsTemplateModel: typeof SmsTemplate,
  ) {}

  async create(createDto: CreateSmsTemplateDto): Promise<SmsTemplate> {
    // Validate placeholder syntax
    this.validatePlaceholders(createDto.message);

    return this.smsTemplateModel.create({
      name: createDto.name,
      triggerEvent: createDto.triggerEvent,
      message: createDto.message,
      isActive: createDto.isActive ?? true,
      sendCount: createDto.sendCount ?? 1,
      sendDelay: createDto.sendDelay ?? 0,
      orderType: createDto.orderType ?? null,
      priority: createDto.priority ?? 0,
    });
  }

  async findAll(queryDto?: SmsTemplateQueryDto): Promise<SmsTemplate[]> {
    const where: any = {};

    if (queryDto?.triggerEvent) {
      where.triggerEvent = queryDto.triggerEvent;
    }

    if (queryDto?.orderType !== undefined) {
      where.orderType = queryDto.orderType;
    }

    if (queryDto?.isActive !== undefined) {
      where.isActive = queryDto.isActive;
    }

    return this.smsTemplateModel.findAll({
      where,
      order: [['priority', 'ASC'], ['createdAt', 'ASC']],
    });
  }

  async findOne(id: number): Promise<SmsTemplate> {
    const template = await this.smsTemplateModel.findByPk(id);
    if (!template) {
      throw new NotFoundException(`SMS template with ID ${id} not found`);
    }
    return template;
  }

  async update(
    id: number,
    updateDto: UpdateSmsTemplateDto,
  ): Promise<SmsTemplate> {
    const template = await this.findOne(id);

    // Validate placeholder syntax if message is being updated
    if (updateDto.message) {
      this.validatePlaceholders(updateDto.message);
    }

    await template.update(updateDto);
    return template.reload();
  }

  async remove(id: number): Promise<void> {
    const template = await this.findOne(id);
    await template.destroy();
  }

  async findActiveTemplatesByTrigger(
    triggerEvent: SmsTriggerEvent,
    orderType?: OrderType,
  ): Promise<SmsTemplate[]> {
    const where: any = {
      triggerEvent,
      isActive: true,
    };

    // Filter by orderType: null means applies to both, otherwise match specific type
    if (orderType !== undefined && orderType !== null) {
      where[Op.or] = [
        { orderType: null }, // Templates that apply to all order types
        { orderType }, // Templates specific to this order type
      ];
    }

    const templates = await this.smsTemplateModel.findAll({
      where,
      order: [['priority', 'ASC'], ['createdAt', 'ASC']],
    });

    // Debug logging
    this.logger.log(
      `[Template Query] Finding templates for trigger: ${triggerEvent}, orderType: ${orderType || 'null'}`,
    );
    this.logger.log(
      `[Template Query] Query where clause: ${JSON.stringify(where, null, 2)}`,
    );
    this.logger.log(
      `[Template Query] Found ${templates.length} template(s)`,
    );
    templates.forEach((template, index) => {
      this.logger.log(
        `[Template Query] Template ${index + 1}: ID=${template.id}, Name="${template.name}", orderType=${template.orderType || 'null'}, priority=${template.priority}, isActive=${template.isActive}`,
      );
    });

    return templates;
  }

  renderTemplate(
    template: SmsTemplate,
    order: Order,
    additionalData?: any,
  ): string {
    this.logger.log(
      `[Template Render] Rendering template "${template.name}" (ID: ${template.id})`,
    );
    this.logger.log(
      `[Template Render] Original message: ${template.message}`,
    );

    let renderedMessage = template.message;

    // Find all placeholders
    const placeholders = template.message.match(this.placeholderRegex) || [];
    this.logger.log(
      `[Template Render] Found ${placeholders.length} placeholder(s): ${placeholders.join(', ')}`,
    );

    // Replace each placeholder
    placeholders.forEach((placeholder: string) => {
      const placeholderName = placeholder.replace(/[{}]/g, '');
      const value = this.getPlaceholderValue(
        order,
        placeholderName,
        additionalData,
      );
      this.logger.log(
        `[Template Render] Replacing {{${placeholderName}}} with: "${value}"`,
      );
      renderedMessage = renderedMessage.replace(placeholder, value);
    });

    this.logger.log(
      `[Template Render] Rendered message: ${renderedMessage}`,
    );

    return renderedMessage;
  }

  getPlaceholderValue(
    order: Order,
    placeholderName: string,
    additionalData?: any,
  ): string {
    const customer = (order as any).customer;

    switch (placeholderName) {
      case 'customerName':
        return customer?.name || 'Customer';
      case 'customerPhone':
        return customer?.phoneNumber || '';
      case 'customerEmail':
        return customer?.email || '';
      case 'orderNumber':
        return order.orderNumber || '';
      case 'orderId':
        return order.id?.toString() || '';
      case 'orderDate':
        return order.orderDate
          ? new Date(order.orderDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : '';
      case 'totalAmount':
        return order.totalAmount
          ? `Nu. ${parseFloat(order.totalAmount.toString()).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : 'Nu. 0.00';
      case 'orderDiscount':
        return order.orderDiscount
          ? parseFloat(order.orderDiscount.toString()).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : '0.00';
      case 'subtotal':
        const subtotal =
          parseFloat(order.totalAmount.toString()) -
          (order.orderDiscount ? parseFloat(order.orderDiscount.toString()) : 0) -
          (order.shippingCost ? parseFloat(order.shippingCost.toString()) : 0);
        return subtotal.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      case 'paymentMethod':
        return order.paymentMethod || '';
      case 'fulfillmentStatus':
        return order.fulfillmentStatus || '';
      case 'paymentStatus':
        return order.paymentStatus || '';
      case 'driverName':
        return additionalData?.driverName || '';
      case 'driverPhone':
        return additionalData?.driverPhone || '';
      case 'vehicleNumber':
        return additionalData?.vehicleNumber || '';
      case 'shippingCost':
        return order.shippingCost
          ? parseFloat(order.shippingCost.toString()).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : '0.00';
      case 'feedbackLink':
        return additionalData?.feedbackLink || '';
      case 'supportPhone':
        // TODO: Get from company config
        return process.env.SUPPORT_PHONE || '';
      case 'trackingLink':
        const frontendUrl = process.env.FRONTEND_URL || '';
        return frontendUrl ? `${frontendUrl}/track/${order.orderNumber}` : '';
      default:
        return '';
    }
  }

  getAvailablePlaceholders(): Array<{ name: string; description: string }> {
    return [
      { name: 'customerName', description: "Customer's name" },
      { name: 'customerPhone', description: "Customer's phone number" },
      { name: 'customerEmail', description: "Customer's email" },
      { name: 'orderNumber', description: 'Order number (e.g., #ORD-2024-0001)' },
      { name: 'orderId', description: 'Order ID' },
      {
        name: 'orderDate',
        description: 'Order date (formatted: MMM DD, YYYY)',
      },
      { name: 'totalAmount', description: 'Total order amount (formatted)' },
      { name: 'orderDiscount', description: 'Discount amount' },
      { name: 'subtotal', description: 'Subtotal before discount' },
      { name: 'paymentMethod', description: 'Payment method (Cash, mBoB, etc.)' },
      { name: 'fulfillmentStatus', description: 'Current fulfillment status' },
      { name: 'paymentStatus', description: 'Current payment status' },
      { name: 'driverName', description: 'Driver name (if available)' },
      { name: 'driverPhone', description: 'Driver phone (if available)' },
      { name: 'vehicleNumber', description: 'Vehicle number (if available)' },
      { name: 'shippingCost', description: 'Shipping cost' },
      { name: 'feedbackLink', description: 'Feedback link (for delivered orders)' },
      { name: 'supportPhone', description: 'Support phone number' },
      { name: 'trackingLink', description: 'Order tracking link' },
    ];
  }

  getAvailableTriggers(): Array<{ value: SmsTriggerEvent; description: string }> {
    return [
      {
        value: SmsTriggerEvent.ORDER_PLACED,
        description: 'When order is first created',
      },
      {
        value: SmsTriggerEvent.PLACED_TO_CONFIRMED,
        description: 'Payment status: PENDING → PAID',
      },
      {
        value: SmsTriggerEvent.CONFIRMED_TO_PROCESSING,
        description: 'Fulfillment: CONFIRMED → PROCESSING',
      },
      {
        value: SmsTriggerEvent.PROCESSING_TO_SHIPPING,
        description: 'Fulfillment: PROCESSING → SHIPPING',
      },
      {
        value: SmsTriggerEvent.SHIPPING_TO_DELIVERED,
        description: 'Fulfillment: SHIPPING → DELIVERED',
      },
      {
        value: SmsTriggerEvent.ORDER_CANCELED,
        description: 'When order is canceled',
      },
      {
        value: SmsTriggerEvent.PAYMENT_FAILED,
        description: 'Payment status: PAID → FAILED',
      },
      {
        value: SmsTriggerEvent.COUNTER_PAYMENT_RECEIPT,
        description: 'Special trigger for counter payment (with delay)',
      },
    ];
  }

  validatePlaceholders(message: string): void {
    const matches = message.match(this.placeholderRegex);
    if (!matches) {
      return; // No placeholders is valid
    }

    const validPlaceholders = this.getAvailablePlaceholders().map((p) => p.name);
    const invalidPlaceholders = matches
      .map((m) => m.replace(/[{}]/g, ''))
      .filter((p) => !validPlaceholders.includes(p));

    if (invalidPlaceholders.length > 0) {
      throw new Error(
        `Invalid placeholders: ${invalidPlaceholders.join(', ')}. Valid placeholders: ${validPlaceholders.join(', ')}`,
      );
    }
  }
}

