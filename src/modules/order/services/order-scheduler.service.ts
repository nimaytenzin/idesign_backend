import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Order } from '../entities/order.entity';
import { FulfillmentStatus } from '../entities/order.enums';
import { InjectModel } from '@nestjs/sequelize';
import { OrderService } from '../order.service';
import { Op } from 'sequelize';

@Injectable()
export class OrderSchedulerService {
  private readonly logger = new Logger(OrderSchedulerService.name);
  private readonly AUTO_DELIVERY_HOURS = 48; // 48 hours after shipping

  constructor(
    @InjectModel(Order)
    private orderModel: typeof Order,
    private readonly orderService: OrderService,
  ) {}

  /**
   * Clean up stale online orders: every 10 minutes.
   * Deletes orders where source=ONLINE, not PAID, fulfillmentStatus=PLACED, placedAt > 10 minutes ago.
   */
  @Cron('*/10 * * * *') // Every 10 minutes
  async cleanupStaleOnlineOrders() {
    this.logger.log('Starting stale online orders cleanup cron job');
    try {
      const deleted = await this.orderService.cleanupStaleOnlineOrders();
      if (deleted > 0) {
        this.logger.log(`Stale online orders cleanup completed: ${deleted} order(s) removed`);
      }
    } catch (error) {
      this.logger.error(
        `Stale online orders cleanup failed: ${(error as Error)?.message}`,
        (error as Error)?.stack,
      );
    }
  }

  /**
   * Auto-delivery cron job: Runs daily at 9:00 PM (21:00)
   * Marks orders as DELIVERED if they were in SHIPPING status 48+ hours ago
   */
  @Cron('0 21 * * *') // 9:00 PM every day
  async autoDeliverShippedOrders() {
    this.logger.log('Starting auto-delivery cron job');

    try {
      // Calculate cutoff date (48 hours ago)
      const cutoffDate = new Date(Date.now() - this.AUTO_DELIVERY_HOURS * 60 * 60 * 1000);

      // Find all orders in SHIPPING status that were shipped 48+ hours ago
      const orders = await this.orderModel.findAll({
        where: {
          fulfillmentStatus: FulfillmentStatus.SHIPPING,
          shippingAt: {
            [Op.lte]: cutoffDate,
          },
        },
      });

      this.logger.log(
        `Found ${orders.length} orders eligible for auto-delivery`,
      );

      for (const order of orders) {
        try {
          // Mark as delivered using service method
          await this.orderService.markOrderAsDelivered(order.id);

          this.logger.log(
            `Order ${order.id} automatically marked as DELIVERED`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to auto-deliver order ${order.id}: ${error.message}`,
            error.stack,
          );
          // Continue with next order
        }
      }

      this.logger.log('Auto-delivery cron job completed');
    } catch (error) {
      this.logger.error(
        `Auto-delivery cron job failed: ${error.message}`,
        error.stack,
      );
    }
  }
}

