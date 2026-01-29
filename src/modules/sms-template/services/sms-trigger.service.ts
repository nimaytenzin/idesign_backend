import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from '../../order/entities/order.entity';
import { FulfillmentStatus, PaymentStatus,OrderSource } from '../../order/entities/order.enums';
import { SmsTemplate, SmsTriggerEvent } from '../entities/sms-template.entity';
import { Outbox, OutboxEventType, OutboxStatus } from '../../outbox/entities/outbox.entity';
import { SmsTemplateService } from './sms-template.service';
import { OutboxService } from '../../outbox/services/outbox.service';
import { Customer } from '../../customer/entities/customer.entity';

/** Fallback SMS messages when no template exists for a trigger. Use {{orderNumber}} and {{customerName}}. */
const FALLBACK_MESSAGES: Record<SmsTriggerEvent, string> = {
  [SmsTriggerEvent.ORDER_PLACED]:
    'Thank you! Your order {{orderNumber}} has been received. We will notify you when it is confirmed.',
  [SmsTriggerEvent.PLACED_TO_CONFIRMED]:
    'Your order {{orderNumber}} has been confirmed. We will update you on the next steps.',
  [SmsTriggerEvent.CONFIRMED_TO_PROCESSING]:
    'Your order {{orderNumber}} is now being processed. We will notify you when it ships.',
  [SmsTriggerEvent.PROCESSING_TO_SHIPPING]:
    'Your order {{orderNumber}} has been shipped! Track your delivery for updates.',
  [SmsTriggerEvent.SHIPPING_TO_DELIVERED]:
    'Your order {{orderNumber}} has been delivered. Thank you for shopping with us!',
  [SmsTriggerEvent.ORDER_CANCELED]:
    'Your order {{orderNumber}} has been canceled. If you have questions, please contact us.',
  [SmsTriggerEvent.PAYMENT_FAILED]:
    'Payment for order {{orderNumber}} could not be processed. Please try again or contact us.',
  [SmsTriggerEvent.COUNTER_PAYMENT_RECEIPT]:
    'Thank you! Your order {{orderNumber}} payment has been received.',
};

@Injectable()
export class SmsTriggerService {
  private readonly logger = new Logger(SmsTriggerService.name);

  constructor(
    @InjectModel(Outbox)
    private outboxModel: typeof Outbox,
    private readonly smsTemplateService: SmsTemplateService,
    private readonly outboxService: OutboxService,
  ) {}

  /**
   * Determine trigger event from status changes
   */
  getTriggerEvent(
    oldFulfillmentStatus: FulfillmentStatus,
    newFulfillmentStatus: FulfillmentStatus,
    oldPaymentStatus?: PaymentStatus,
    newPaymentStatus?: PaymentStatus,
  ): SmsTriggerEvent | null {
    // Payment status changes
    if (
      oldPaymentStatus === PaymentStatus.PENDING &&
      newPaymentStatus === PaymentStatus.PAID
    ) {
      return SmsTriggerEvent.PLACED_TO_CONFIRMED;
    }

    if (
      oldPaymentStatus === PaymentStatus.PAID &&
      newPaymentStatus === PaymentStatus.FAILED
    ) {
      return SmsTriggerEvent.PAYMENT_FAILED;
    }

    // Fulfillment status changes
    if (
      oldFulfillmentStatus === FulfillmentStatus.CONFIRMED &&
      newFulfillmentStatus === FulfillmentStatus.PROCESSING
    ) {
      return SmsTriggerEvent.CONFIRMED_TO_PROCESSING;
    }

    if (
      oldFulfillmentStatus === FulfillmentStatus.PROCESSING &&
      newFulfillmentStatus === FulfillmentStatus.SHIPPING
    ) {
      return SmsTriggerEvent.PROCESSING_TO_SHIPPING;
    }

    if (
      oldFulfillmentStatus === FulfillmentStatus.SHIPPING &&
      newFulfillmentStatus === FulfillmentStatus.DELIVERED
    ) {
      return SmsTriggerEvent.SHIPPING_TO_DELIVERED;
    }

    if (newFulfillmentStatus === FulfillmentStatus.CANCELED) {
      return SmsTriggerEvent.ORDER_CANCELED;
    }

    return null;
  }

  /**
   * Process SMS templates for a trigger event
   * Finds all active templates, orders by priority, and schedules messages
   */
  async processSmsTemplates(
    order: Order,
    triggerEvent: SmsTriggerEvent,
    additionalData?: any,
  ): Promise<void> {
    this.logger.log(
      `[SMS Trigger] ========================================`,
    );
    this.logger.log(
      `[SMS Trigger] Processing SMS templates for order ${order.id}`,
    );
    this.logger.log(
      `[SMS Trigger] Order Number: ${order.orderNumber}`,
    );
    this.logger.log(
      `[SMS Trigger] Trigger Event: ${triggerEvent}`,
    );
    this.logger.log(
      `[SMS Trigger] Order Source: ${order.orderSource}`,
    );
    this.logger.log(
      `[SMS Trigger] Additional Data: ${JSON.stringify(additionalData || {})}`,
    );

    // Get customer for phone number
    const customer = (order as any).customer as Customer;
    if (!customer) {
      this.logger.warn(
        `[SMS Trigger] ❌ Customer not loaded for order ${order.id}, cannot send SMS`,
      );
      return;
    }

    this.logger.log(
      `[SMS Trigger] Customer ID: ${customer.id}, Name: ${customer.name}`,
    );

    if (!customer?.phoneNumber) {
      this.logger.warn(
        `[SMS Trigger] ❌ No phone number found for order ${order.id} (customer ID: ${customer.id}), skipping SMS templates`,
      );
      return;
    }

    this.logger.log(
      `[SMS Trigger] Customer Phone: ${customer.phoneNumber}`,
    );

    // Find active templates for this trigger
    this.logger.log(
      `[SMS Trigger] Searching for templates with triggerEvent=${triggerEvent}, orderSource=${order.orderSource}...`,
    );
    const templates = await this.smsTemplateService.findActiveTemplatesByTrigger(
      triggerEvent,
      order.orderSource,
    );

    if (templates.length === 0) {
      this.logger.warn(
        `[SMS Trigger] ⚠️  No active templates found for trigger ${triggerEvent} and orderSource ${order.orderSource}`,
      );
      this.logger.log(
        `[SMS Trigger] Sending fallback SMS for trigger ${triggerEvent} so customer still receives a proper message.`,
      );
      await this.scheduleFallbackSms(order, triggerEvent, customer.phoneNumber);
      this.logger.log(
        `[SMS Trigger] ========================================`,
      );
      return;
    }

    this.logger.log(
      `[SMS Trigger] ✅ Found ${templates.length} active template(s)`,
    );

    // Process each template (already ordered by priority)
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      this.logger.log(
        `[SMS Trigger] Processing template ${i + 1}/${templates.length}: "${template.name}" (ID: ${template.id}, Priority: ${template.priority})`,
      );
      await this.scheduleTemplateMessages(order, template, additionalData);
    }

    this.logger.log(
      `[SMS Trigger] ========================================`,
    );
  }

  /**
   * Schedule messages for a single template
   * Handles sendCount repetition and sendDelay
   */
  async scheduleTemplateMessages(
    order: Order,
    template: SmsTemplate,
    additionalData?: any,
  ): Promise<void> {
    const customer = (order as any).customer as Customer;
    const phoneNumber = customer?.phoneNumber;

    if (!phoneNumber) {
      this.logger.warn(
        `[Template Scheduling] ❌ No phone number available, skipping template "${template.name}"`,
      );
      return;
    }

    this.logger.log(
      `[Template Scheduling] Template: "${template.name}" (ID: ${template.id})`,
    );
    this.logger.log(
      `[Template Scheduling] Send Count: ${template.sendCount}, Send Delay: ${template.sendDelay} minutes`,
    );
    this.logger.log(
      `[Template Scheduling] Original Message: ${template.message}`,
    );

    // Render the template message
    const renderedMessage = this.smsTemplateService.renderTemplate(
      template,
      order,
      additionalData,
    );

    this.logger.log(
      `[Template Scheduling] Rendered Message: ${renderedMessage}`,
    );
    this.logger.log(
      `[Template Scheduling] Message Length: ${renderedMessage.length} characters`,
    );

    // Calculate base scheduled time (now + template delay)
    const baseScheduledTime = new Date();
    baseScheduledTime.setMinutes(
      baseScheduledTime.getMinutes() + template.sendDelay,
    );

    this.logger.log(
      `[Template Scheduling] Base scheduled time: ${baseScheduledTime.toISOString()}`,
    );

    // Create outbox entries for each sendCount
    for (let i = 0; i < template.sendCount; i++) {
      // Calculate delay for this specific send
      // First send at baseScheduledTime, subsequent sends delayed by sendDelay each
      const scheduledFor = new Date(baseScheduledTime);
      if (i > 0) {
        scheduledFor.setMinutes(
          scheduledFor.getMinutes() + template.sendDelay * i,
        );
      }

      this.logger.log(
        `[Template Scheduling] Creating outbox entry ${i + 1}/${template.sendCount}, scheduled for: ${scheduledFor.toISOString()}`,
      );

      try {
        const outboxEntry = await this.outboxModel.create({
          orderId: order.id,
          eventType: OutboxEventType.SEND_SMS,
          payload: {
            phoneNumber,
            message: renderedMessage,
            templateId: template.id,
            templateName: template.name,
            sendIndex: i + 1,
            totalSends: template.sendCount,
          },
          scheduledFor,
          status: OutboxStatus.PENDING,
          retryCount: 0,
        });

        this.logger.log(
          `[Template Scheduling] ✅ Successfully created outbox entry ID: ${outboxEntry.id}`,
        );
        this.logger.log(
          `[Template Scheduling]   Order ID: ${order.id}, Phone: ${phoneNumber}, Scheduled: ${scheduledFor.toISOString()}`,
        );
        this.logger.log(
          `[Template Scheduling]   Template: "${template.name}" (${i + 1}/${template.sendCount})`,
        );
      } catch (error) {
        this.logger.error(
          `[Template Scheduling] ❌ Failed to create outbox entry for template "${template.name}" (${i + 1}/${template.sendCount}) on order ${order.id}`,
        );
        this.logger.error(
          `[Template Scheduling] Error: ${error.message}`,
          error.stack,
        );
        throw error; // Re-throw to let caller handle
      }
    }

    this.logger.log(
      `[Template Scheduling] ✅ Completed scheduling for template "${template.name}"`,
    );
  }

  /**
   * Build fallback message for a trigger when no template exists.
   * Replaces {{orderNumber}} and {{customerName}}.
   */
  private getFallbackMessage(order: Order, triggerEvent: SmsTriggerEvent): string {
    const customer = (order as any).customer as Customer | undefined;
    const orderNumber = order.orderNumber || `#${order.id}`;
    const customerName = customer?.name || 'Customer';
    const template = FALLBACK_MESSAGES[triggerEvent] || `Your order ${orderNumber} status has been updated.`;
    return template
      .replace(/\{\{orderNumber\}\}/g, orderNumber)
      .replace(/\{\{customerName\}\}/g, customerName);
  }

  /**
   * Schedule a single fallback SMS when no template exists for the trigger.
   * Ensures the customer always receives a proper message for each order process.
   */
  private async scheduleFallbackSms(
    order: Order,
    triggerEvent: SmsTriggerEvent,
    phoneNumber: string,
  ): Promise<void> {
    const message = this.getFallbackMessage(order, triggerEvent);
    const scheduledFor = new Date();

    try {
      await this.outboxModel.create({
        orderId: order.id,
        eventType: OutboxEventType.SEND_SMS,
        payload: {
          phoneNumber,
          message,
          templateId: null,
          templateName: `Fallback: ${triggerEvent}`,
          sendIndex: 1,
          totalSends: 1,
        },
        scheduledFor,
        status: OutboxStatus.PENDING,
        retryCount: 0,
      });
      this.logger.log(
        `[SMS Trigger] ✅ Fallback SMS queued for order ${order.id}, trigger ${triggerEvent}`,
      );
    } catch (error) {
      this.logger.error(
        `[SMS Trigger] ❌ Failed to queue fallback SMS for order ${order.id}: ${(error as Error)?.message}`,
        (error as Error)?.stack,
      );
      throw error;
    }
  }
}

