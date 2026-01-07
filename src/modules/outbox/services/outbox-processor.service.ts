import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Outbox, OutboxEventType, OutboxStatus } from '../entities/outbox.entity';
import { SmsService } from '../../external/sms/sms.service';
import { OutboxService } from './outbox.service';

@Injectable()
export class OutboxProcessorService {
  private readonly logger = new Logger(OutboxProcessorService.name);
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 60000; // 1 minute

  constructor(
    @InjectModel(Outbox)
    private outboxModel: typeof Outbox,
    private readonly outboxService: OutboxService,
    private readonly smsService: SmsService,
  ) {}

  /**
   * Process outbox tasks every 30 seconds
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processOutbox() {
    const tasks = await this.outboxService.getPendingTasks(50);
    
    if (tasks.length === 0) {
      return;
    }

    this.logger.log(`Processing ${tasks.length} outbox tasks`);

    for (const task of tasks) {
      try {
        await this.processTask(task);
      } catch (error) {
        this.logger.error(
          `Failed to process outbox task ${task.id}: ${error.message}`,
          error.stack,
        );
        await this.handleTaskFailure(task, error);
      }
    }
  }

  private async processTask(task: Outbox): Promise<void> {
    // Mark as processing
    await this.outboxService.updateTaskStatus(
      task.id,
      OutboxStatus.PROCESSING,
    );

    switch (task.eventType) {
      case OutboxEventType.SEND_SMS:
        await this.processSmsTask(task);
        break;
      case OutboxEventType.SEND_EMAIL:
        // TODO: Implement email sending
        this.logger.warn('Email sending not yet implemented');
        break;
      case OutboxEventType.WEBHOOK:
        // TODO: Implement webhook
        this.logger.warn('Webhook not yet implemented');
        break;
      default:
        throw new Error(`Unknown event type: ${task.eventType}`);
    }

    // Mark as completed
    await this.outboxService.updateTaskStatus(
      task.id,
      OutboxStatus.COMPLETED,
    );
  }

  private async processSmsTask(task: Outbox): Promise<void> {
    const { phoneNumber, message } = task.payload;

    if (!phoneNumber) {
      throw new Error('Phone number is required for SMS task');
    }

    if (!message) {
      throw new Error('Message is required for SMS task');
    }

    // Message is already rendered by SmsTriggerService when outbox entry was created
    await this.smsService.sendSmsNotification({
      phoneNumber,
      message,
    });

    this.logger.log(
      `SMS sent for order ${task.orderId} to ${phoneNumber} (template: ${task.payload.templateName || 'N/A'})`,
    );
  }

  private async handleTaskFailure(task: Outbox, error: Error): Promise<void> {
    if (task.retryCount >= this.MAX_RETRIES) {
      // Max retries exceeded, mark as failed
      await this.outboxService.updateTaskStatus(
        task.id,
        OutboxStatus.FAILED,
        error.message,
      );
      this.logger.error(
        `Task ${task.id} failed after ${this.MAX_RETRIES} retries`,
      );
    } else {
      // Reschedule for retry
      await this.outboxService.incrementRetryAndReschedule(
        task.id,
        this.RETRY_DELAY_MS * (task.retryCount + 1), // Exponential backoff
      );
      this.logger.warn(
        `Task ${task.id} will be retried (attempt ${task.retryCount + 1}/${this.MAX_RETRIES})`,
      );
    }
  }
}

