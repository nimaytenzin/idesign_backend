import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Outbox, OutboxEventType, OutboxStatus } from '../entities/outbox.entity';
import { Op } from 'sequelize';

@Injectable()
export class OutboxService {
  constructor(
    @InjectModel(Outbox)
    private outboxModel: typeof Outbox,
  ) {}

  async addOutboxEvent(
    orderId: number,
    eventType: OutboxEventType,
    payload: any,
    scheduledFor: Date,
  ): Promise<Outbox> {
    return this.outboxModel.create({
      orderId,
      eventType,
      payload,
      scheduledFor,
      status: OutboxStatus.PENDING,
      retryCount: 0,
    });
  }

  async getPendingTasks(limit: number = 100): Promise<Outbox[]> {
    return this.outboxModel.findAll({
      where: {
        status: OutboxStatus.PENDING,
        scheduledFor: {
          [Op.lte]: new Date(),
        },
      },
      limit,
      order: [['scheduledFor', 'ASC']],
    });
  }

  async updateTaskStatus(
    taskId: number,
    status: OutboxStatus,
    errorMessage?: string,
  ): Promise<void> {
    const task = await this.outboxModel.findByPk(taskId);
    if (!task) {
      return;
    }

    await task.update({
      status,
      errorMessage,
      ...(status === OutboxStatus.PROCESSING ? {} : { retryCount: task.retryCount + 1 }),
    });
  }

  async incrementRetryAndReschedule(
    taskId: number,
    delayMs: number,
  ): Promise<void> {
    const task = await this.outboxModel.findByPk(taskId);
    if (!task) {
      return;
    }

    const newScheduledFor = new Date(Date.now() + delayMs);
    await task.update({
      retryCount: task.retryCount + 1,
      scheduledFor: newScheduledFor,
      status: OutboxStatus.PENDING,
    });
  }
}

