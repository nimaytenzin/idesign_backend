import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { Customer } from '../customer/entities/customer.entity';
import { Order } from './entities/order.entity';
import { FulfillmentStatus, PaymentStatus, PaymentMethod, OrderSource, FulfillmentType } from './entities/order.enums';
import { OrderItem } from './entities/order-item.entity';
import { OrderDiscount } from './entities/order-discount.entity';
import { Product } from '../product/entities/product.entity';
import { PaymentReceiptService } from '../payment-receipt/payment-receipt.service';
import { CustomerService } from '../customer/customer.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateFulfillmentStatusDto } from './dto/update-fulfillment-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { VerifyOrderDto } from './dto/verify-order.dto';
import { GetCustomerStatusDto } from './dto/get-customer-status.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { ShipOrderDto } from './dto/ship-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { MonthQueryDto } from './dto/month-query.dto';
import { OrdersByMonthResponseDto } from './dto/orders-by-month-response.dto';
import { OrderStatisticsByMonthResponseDto } from './dto/order-statistics-by-month-response.dto';
import { OrderMonthlyReportResponseDto } from './dto/order-monthly-report-response.dto';
import { OrderDailyStatsResponseDto } from './dto/order-daily-stats-response.dto';
import { OrderYearlyReportResponseDto } from './dto/order-yearly-report-response.dto';
import { TrackOrderDto } from './dto/track-order.dto';
import { MarkDeliveredDto } from './dto/mark-delivered.dto';
import { SmsTriggerService } from '../sms-template/services/sms-trigger.service';
import { SmsTriggerEvent } from '../sms-template/entities/sms-template.entity';
import { SmsService } from '../external/sms/sms.service';
import { SendSmsNotificationDto } from '../external/sms/dto/create-sm.dto';
import { DiscountCalculationService } from '../discount/services/discount-calculation.service';
import { DiscountScope } from '../discount/entities/discount.entity';
import { User } from '../auth/entities/user.entity';
import { AffiliateCommission } from '../affiliate-marketer-management/affiliate-commission/entities/affiliate-commission.entity';
import { v4 as uuidv4 } from 'uuid';
import { AffiliateProfile } from '../affiliate-marketer-management/affiliate-profile/entities/affiliate-profile.entity';
import { OrderPlacementSupportService } from './services/order-placement-support.service';
import { OnlinePlaceOrderService } from './services/online-place-order.service';
import { InstorePlaceOrderService } from './services/instore-place-order.service';
import { PaginationService } from '../../common/pagination/pagination.service';
import { GetOrdersPaginatedQueryDto } from './dto/get-orders-paginated-query.dto';
import { GetOrdersCompletedQueryDto } from './dto/get-orders-completed-query.dto';
import { GetOrdersCancelledQueryDto } from './dto/get-orders-cancelled-query.dto';
import { CounterPayNowPickupLaterDto } from './dto/counter-pay-now-pickup-later.dto';
import { PaginatedResponseDto } from '../../common/pagination/dto/paginated-response.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectModel(Order)
    private orderModel: typeof Order,
    @InjectModel(OrderItem)
    private orderItemModel: typeof OrderItem,
    @InjectModel(OrderDiscount)
    private orderDiscountModel: typeof OrderDiscount,
    @InjectModel(Product)
    private productModel: typeof Product,
    private readonly paymentReceiptService: PaymentReceiptService,
    @InjectModel(AffiliateCommission)
    private affiliateCommissionModel: typeof AffiliateCommission,
    private readonly sequelize: Sequelize,
    private readonly customerService: CustomerService,
    private readonly smsTriggerService: SmsTriggerService,
    private readonly discountCalculationService: DiscountCalculationService,
    private readonly paginationService: PaginationService,
    private readonly smsService: SmsService,
    private readonly orderPlacementSupport: OrderPlacementSupportService,
    private readonly onlinePlaceOrderService: OnlinePlaceOrderService,
    private readonly instorePlaceOrderService: InstorePlaceOrderService,
  ) {}

  /**
   * Place an online order (or counter pay-later). Delegates to OnlinePlaceOrderService.
   */
  async createOrder(createOrderDto: CreateOrderDto, userId?: number): Promise<Order> {
    return this.onlinePlaceOrderService.onlinePlaceOrder(createOrderDto, userId);
  }

  /**
   * Place a counter order (Pay Now or Pay Later). Delegates to InstorePlaceOrderService.
   */
  async instorePlaceOrder(
    createOrderDto: CreateOrderDto,
    userId?: number,
  ): Promise<Order> {
    return this.instorePlaceOrderService.instorePlaceOrder(createOrderDto, userId);
  }

  /**
   * Clean up stale online orders: source ONLINE, not PAID, fulfillmentStatus PLACED, placedAt older than 10 minutes.
   * Deletes order items, order discounts, affiliate commissions, then the order.
   * Called by cron every 10 minutes.
   */
  async cleanupStaleOnlineOrders(): Promise<number> {
    const staleCutoff = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago

    const orders = await this.orderModel.findAll({
      where: {
        orderSource: OrderSource.ONLINE,
        fulfillmentStatus: FulfillmentStatus.PLACED,
        paymentStatus: { [Op.ne]: PaymentStatus.PAID },
        placedAt: { [Op.lt]: staleCutoff },
      },
    });

    if (orders.length === 0) {
      return 0;
    }

    let deleted = 0;
    for (const order of orders) {
      try {
        await this.sequelize.transaction(async (transaction) => {
          await this.orderDiscountModel.destroy({
            where: { orderId: order.id },
            transaction,
          });
          await this.orderItemModel.destroy({
            where: { orderId: order.id },
            transaction,
          });
          await this.affiliateCommissionModel.destroy({
            where: { orderId: order.id },
            transaction,
          });
          await order.destroy({ transaction });
        });
        deleted++;
        this.logger.log(
          `[Cleanup] Deleted stale online order id=${order.id} orderNumber=${order.orderNumber}`,
        );
      } catch (e) {
        this.logger.error(
          `[Cleanup] Failed to delete stale order id=${order.id}: ${(e as Error)?.message}`,
          (e as Error)?.stack,
        );
      }
    }

    if (deleted > 0) {
      this.logger.log(`[Cleanup] Removed ${deleted} stale online order(s).`);
    }
    return deleted;
  }

  /**
   * Mark a PICKUP or INSTORE order as collected (fulfillmentStatus → DELIVERED).
   * Allowed when fulfillmentType is PICKUP or INSTORE and status is CONFIRMED or PROCESSING.
   */
  async markOrderAsCollected(id: number): Promise<Order> {
    const order = await this.findOneOrder(id);
    if (
      order.fulfillmentType !== FulfillmentType.PICKUP &&
      order.fulfillmentType !== FulfillmentType.INSTORE
    ) {
      throw new BadRequestException(
        `markOrderAsCollected only applies to PICKUP or INSTORE. This order is ${order.fulfillmentType}. Use PATCH /orders/:id/fulfillment-status or POST /orders/:id/deliver for DELIVERY.`,
      );
    }
    if (
      order.fulfillmentStatus !== FulfillmentStatus.CONFIRMED &&
      order.fulfillmentStatus !== FulfillmentStatus.PROCESSING
    ) {
      throw new BadRequestException(
        `Order must be CONFIRMED or PROCESSING to mark as collected. Current: ${order.fulfillmentStatus}.`,
      );
    }
    return this.updateFulfillmentStatus(id, { fulfillmentStatus: FulfillmentStatus.DELIVERED });
  }

  /**
   * Mark order as CONFIRMED (fulfillmentStatus PLACED → CONFIRMED). Sets confirmedAt.
   * Order must be in PLACED. Does not change payment status; use POST /orders/:id/confirm to confirm and record payment.
   */
  async markOrderAsConfirmed(id: number, internalNotes?: string): Promise<Order> {
    const order = await this.findOneOrder(id);
    if (order.fulfillmentStatus !== FulfillmentStatus.PLACED) {
      throw new BadRequestException(
        `Order must be in PLACED status to mark as confirmed. Current: ${order.fulfillmentStatus}.`,
      );
    }
    return this.updateFulfillmentStatus(id, {
      fulfillmentStatus: FulfillmentStatus.CONFIRMED,
      internalNotes,
    });
  }

  /**
   * Handle online payment success (e.g. after DR request from gateway).
   * Marks order PAID, advances fulfillment (PLACED→CONFIRMED, CONFIRMED→PROCESSING), sends payment-success SMS.
   * Called by payment-settlement when gateway confirms payment.
   */
  async handleOnlinePaymentSuccess(
    orderId: number,
    params: {
      paymentMethod: PaymentMethod;
      paymentDate?: string;
      internalNotes?: string;
    },
  ): Promise<Order> {
    await this.processPayment(
      orderId,
      {
        paymentMethod: params.paymentMethod,
        paymentDate: params.paymentDate ?? new Date().toISOString(),
        internalNotes: params.internalNotes,
      },
      true,
    );

    const updatedOrder = await this.findOneOrder(orderId);
    if (updatedOrder.fulfillmentStatus === FulfillmentStatus.PLACED) {
      await this.updateFulfillmentStatus(
        orderId,
        {
          fulfillmentStatus: FulfillmentStatus.CONFIRMED,
          internalNotes: 'Order confirmed after successful online payment',
        },
        true,
      );
    } else if (updatedOrder.fulfillmentStatus === FulfillmentStatus.CONFIRMED) {
      await this.updateFulfillmentStatus(
        orderId,
        {
          fulfillmentStatus: FulfillmentStatus.PROCESSING,
          internalNotes: 'Order processing started after successful online payment',
        },
        true,
      );
    }

    const finalOrder = await this.findOneOrder(orderId);
    this.sendOnlinePaymentSuccessSms(finalOrder);
    this.logger.log(`[Online Payment Success] Order ID: ${orderId} paid and processing`);
    return finalOrder;
  }

  /**
   * Send single payment-success SMS: delivery (driver/vehicle details) vs pickup (ready at store).
   */
  private sendOnlinePaymentSuccessSms(order: Order): void {
    const customer = (order as any).customer;
    const phone =
      typeof customer?.phoneNumber === 'string' ? customer.phoneNumber.trim() : null;
    if (!phone) return;

    const orderNumber = order.orderNumber || `Order #${order.id}`;
    const message =
      order.fulfillmentType === FulfillmentType.DELIVERY
        ? `Thank you for your payment. We will send driver and vehicle details as soon as possible for your order ${orderNumber}.`
        : `Thank you for your payment. Your order ${orderNumber} is ready for pickup at our store.`;

    this.smsService
      .sendSmsNotification({ phoneNumber: phone, message })
      .then(() =>
        this.logger.log(
          `[Online Payment Success] SMS sent to ${phone} for order ${order.id}`,
        ),
      )
      .catch((e) =>
        this.logger.warn(
          `[Online Payment Success] SMS failed for order ${order.id}: ${(e as Error)?.message ?? e}`,
        ),
      );
  }

  async findAllOrders(query?: OrderQueryDto): Promise<Order[]> {
    const where: any = {};

    if (query?.customerId) {
      where.customerId = query.customerId;
    }

    if (query?.fulfillmentStatus) {
      where.fulfillmentStatus = query.fulfillmentStatus;
    }

    if (query?.startDate || query?.endDate) {
      where.placedAt = {};
      if (query.startDate) {
        where.placedAt[Op.gte] = new Date(query.startDate);
      }
      if (query.endDate) {
        where.placedAt[Op.lte] = new Date(query.endDate);
      }
    }

    return this.orderModel.findAll({
      where,
      include: [
        { model: Customer, as: 'customer' },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }],
        },
        { model: OrderDiscount, as: 'orderDiscounts' },
      ],
      order: [['placedAt', 'DESC']],
    });
  }

  /**
   * Get orders to confirm (PLACED + PENDING payment). Unpaginated.
   */
  async findOrdersToConfirm(): Promise<Order[]> {
    return this.orderModel.findAll({
      where: {
        fulfillmentStatus: FulfillmentStatus.PLACED,
       },
      include: [
        { model: Customer, as: 'customer' },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }],
        },
        { model: OrderDiscount, as: 'orderDiscounts' },
      ],
      order: [['placedAt', 'DESC']],
    });
  }

  /**
   * Get orders to deliver (DELIVERY + SHIPPING – out for delivery to customer's address, to be marked delivered). Unpaginated.
   */
  async findOrdersToDeliver(): Promise<Order[]> {
    return this.orderModel.findAll({
      where: {
        fulfillmentType: FulfillmentType.DELIVERY,
        fulfillmentStatus: { [Op.in]: [FulfillmentStatus.CONFIRMED, FulfillmentStatus.PROCESSING,FulfillmentStatus.PLACED] },
      },
      include: [
        { model: Customer, as: 'customer' },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }],
        },
        { model: OrderDiscount, as: 'orderDiscounts' },
      ],
      order: [['shippingAt', 'ASC'], ['placedAt', 'DESC']],
    });
  }

  /**
   * Get orders ready for pickup (PICKUP or INSTORE + CONFIRMED or PROCESSING – customer to collect from store). Unpaginated.
   * Use POST /orders/:id/mark-collected when the customer picks up.
   */
  async findOrdersReadyForPickup(): Promise<Order[]> {
    return this.orderModel.findAll({
      where: {
        fulfillmentType: { [Op.in]: [FulfillmentType.PICKUP] },
        fulfillmentStatus: { [Op.in]: [FulfillmentStatus.CONFIRMED, FulfillmentStatus.PROCESSING] },
      },
      include: [
        { model: Customer, as: 'customer' },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }],
        },
        { model: OrderDiscount, as: 'orderDiscounts' },
      ],
      order: [['placedAt', 'ASC'], ['id', 'ASC']],
    });
  }

  /**
   * Get orders to track (DELIVERY + SHIPPING – out for delivery / in transit). Unpaginated.
   * Use: Orders currently being delivered, e.g. for tracking dashboard or customer tracking view.
   */
  async findOrdersToTrack(): Promise<Order[]> {
    return this.orderModel.findAll({
      where: {
        fulfillmentType: FulfillmentType.DELIVERY,
        fulfillmentStatus: FulfillmentStatus.SHIPPING,
      },
      include: [
        { model: Customer, as: 'customer' },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }],
        },
        { model: OrderDiscount, as: 'orderDiscounts' },
      ],
      order: [['shippingAt', 'ASC'], ['placedAt', 'DESC']],
    });
  }

  /**
   * Get orders paginated with filters - Admin and Staff only.
   * Supports paymentStatus, orderSource, fulfillmentType, placedAtFrom/To for phase views
   * (Delivered & Paid, Collection Gap, month/date filters).
   */
  async getOrdersPaginated(queryDto: GetOrdersPaginatedQueryDto): Promise<PaginatedResponseDto<Order>> {
    const {
      fulfillmentStatus,
      paymentStatus,
      orderSource,
      fulfillmentType,
      placedAtFrom,
      placedAtTo,
    } = queryDto;
    const { page, limit, offset } = this.paginationService.normalizePagination(queryDto);

    const where: any = {};
    if (fulfillmentStatus) {
      where.fulfillmentStatus = fulfillmentStatus;
    }
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }
    if (orderSource) {
      where.orderSource = orderSource;
    }
    if (fulfillmentType) {
      where.fulfillmentType = fulfillmentType;
    }
    if (placedAtFrom || placedAtTo) {
      where.placedAt = {};
      if (placedAtFrom) {
        where.placedAt[Op.gte] = new Date(placedAtFrom);
      }
      if (placedAtTo) {
        // Include full day: treat YYYY-MM-DD as end-of-day UTC
        const toDate =
          placedAtTo.includes('T') || placedAtTo.includes(' ')
            ? new Date(placedAtTo)
            : new Date(placedAtTo + 'T23:59:59.999Z');
        where.placedAt[Op.lte] = toDate;
      }
    }

    const { count, rows } = await this.orderModel.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer' },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }],
        },
        { model: OrderDiscount, as: 'orderDiscounts' },
      ],
      order: [['placedAt', 'DESC']],
      limit,
      offset,
    });

    return this.paginationService.createPaginatedResponse(
      rows.map((order) => order.toJSON()),
      count,
      { page, limit },
    );
  }

  /**
   * Get phase counts for admin tab badges (Pending Action, In Progress, Collection Gap, Completed).
   * Filters match ORDER_MANAGEMENT_ADMIN_UI_SUGGESTIONS.md §2.2.
   */
  async getAdminPhaseCounts(): Promise<{
    pendingAction: number;
    inProgress: number;
    collectionGap: number;
    completed: number;
  }> {
    const [pendingAction, inProgress, collectionGap, completed] = await Promise.all([
      this.orderModel.count({
        where: {
          [Op.or]: [
            {
              fulfillmentStatus: FulfillmentStatus.PLACED,
              paymentStatus: PaymentStatus.PENDING,
            },
            {
              fulfillmentStatus: { [Op.in]: [FulfillmentStatus.CONFIRMED, FulfillmentStatus.PROCESSING] },
              paymentStatus: { [Op.in]: [PaymentStatus.PAID, PaymentStatus.PENDING] },
            },
          ],
        },
      }),
      this.orderModel.count({
        where: { fulfillmentStatus: FulfillmentStatus.SHIPPING },
      }),
      this.orderModel.count({
        where: {
          [Op.or]: [
            {
              fulfillmentStatus: FulfillmentStatus.DELIVERED,
              paymentStatus: { [Op.in]: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] },
            },
            {
              paymentStatus: PaymentStatus.PARTIAL,
              fulfillmentStatus: {
                [Op.in]: [
                  FulfillmentStatus.PLACED,
                  FulfillmentStatus.CONFIRMED,
                  FulfillmentStatus.PROCESSING,
                  FulfillmentStatus.SHIPPING,
                ],
              },
            },
          ],
        },
      }),
      this.orderModel.count({
        where: {
          [Op.or]: [
            {
              fulfillmentStatus: FulfillmentStatus.DELIVERED,
              paymentStatus: PaymentStatus.PAID,
            },
            { fulfillmentStatus: FulfillmentStatus.CANCELED },
          ],
        },
      }),
    ]);
    return { pendingAction, inProgress, collectionGap, completed };
  }

  /**
   * Active Workflow: To Process.
   * Unpaid & Not Delivered: (PLACED | CONFIRMED) + (PENDING | PARTIAL).
   * Primary action: Record Payment / Confirm Order.
   * Unpaginated; for GET /orders/admin/to-process.
   */
  async findOrdersToProcess(): Promise<Order[]> {
    return this.orderModel.findAll({
      where: {
        fulfillmentStatus: { [Op.in]: [FulfillmentStatus.PLACED] },
        paymentStatus: { [Op.in]: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] },
      },
      include: [
        { model: Customer, as: 'customer' },
        { model: OrderItem, as: 'orderItems', include: [{ model: Product, as: 'product' }] },
        { model: OrderDiscount, as: 'orderDiscounts' },
      ],
      order: [['placedAt', 'DESC']],
    });
  }

  /**
   * Active Workflow: To Deliver.
   * Paid & Not Delivered: (CONFIRMED | PROCESSING) + PAID.
   * Primary action: Ship Order (Assign Driver).
    */
  async findOrdersReadyToShip(): Promise<Order[]> {
    return this.orderModel.findAll({
      where: {
        fulfillmentStatus: { [Op.in]: [FulfillmentStatus.CONFIRMED, FulfillmentStatus.PROCESSING] },
        fulfillmentType: FulfillmentType.PICKUP,
       },
      include: [
        { model: Customer, as: 'customer' },
        { model: OrderItem, as: 'orderItems', include: [{ model: Product, as: 'product' }] },
        { model: OrderDiscount, as: 'orderDiscounts' },
      ],
      order: [['placedAt', 'DESC']],
    });
  }

  /**
   * Active Workflow: Unpaid Delivery.
   * Delivered but Unpaid: DELIVERED + (PENDING | PARTIAL).
   * Primary action: Record Final Payment.
   * Unpaginated; for GET /orders/admin/unpaid-delivery.
   */
  async findOrdersUnpaidDelivery(): Promise<Order[]> {
    return this.orderModel.findAll({
      where: {
        fulfillmentStatus: FulfillmentStatus.DELIVERED,
        paymentStatus: { [Op.in]: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] },
      },
      include: [
        { model: Customer, as: 'customer' },
        { model: OrderItem, as: 'orderItems', include: [{ model: Product, as: 'product' }] },
        { model: OrderDiscount, as: 'orderDiscounts' },
      ],
      order: [['deliveredAt', 'DESC'], ['placedAt', 'DESC']],
    });
  }

  /**
   * History: Completed. DELIVERED + PAID, filtered by deliveredAt.
   * Default date range: current month. Paginated.
   * For GET /orders/admin/completed.
   */
  async getOrdersCompleted(query: GetOrdersCompletedQueryDto): Promise<PaginatedResponseDto<Order>> {
    const { page, limit, offset } = this.paginationService.normalizePagination(query);
    let deliveredAtFrom = query.deliveredAtFrom ? new Date(query.deliveredAtFrom) : null;
    let deliveredAtTo = query.deliveredAtTo ? new Date(query.deliveredAtTo) : null;

    if (!deliveredAtFrom || !deliveredAtTo) {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      deliveredAtFrom = deliveredAtFrom ?? new Date(y, m, 1, 0, 0, 0, 0);
      deliveredAtTo = deliveredAtTo ?? new Date(y, m + 1, 0, 23, 59, 59, 999);
    } else if (!query.deliveredAtTo?.includes('T') && !query.deliveredAtTo?.includes(' ')) {
      deliveredAtTo = new Date(query.deliveredAtTo + 'T23:59:59.999Z');
    }

    const where: any = {
      fulfillmentStatus: FulfillmentStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      deliveredAt: { [Op.gte]: deliveredAtFrom, [Op.lte]: deliveredAtTo },
    };

    const { count, rows } = await this.orderModel.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer' },
        { model: OrderItem, as: 'orderItems', include: [{ model: Product, as: 'product' }] },
        { model: OrderDiscount, as: 'orderDiscounts' },
      ],
      order: [['deliveredAt', 'DESC'], ['placedAt', 'DESC']],
      limit,
      offset,
    });

    return this.paginationService.createPaginatedResponse(
      rows.map((o) => o.toJSON()),
      count,
      { page, limit },
    );
  }

  /**
   * History: Cancelled. CANCELED, filtered by updatedAt.
   * Default date range: current month. Paginated.
   * For GET /orders/admin/cancelled.
   */
  async getOrdersCancelled(query: GetOrdersCancelledQueryDto): Promise<PaginatedResponseDto<Order>> {
    const { page, limit, offset } = this.paginationService.normalizePagination(query);
    let updatedAtFrom = query.updatedAtFrom ? new Date(query.updatedAtFrom) : null;
    let updatedAtTo = query.updatedAtTo ? new Date(query.updatedAtTo) : null;

    if (!updatedAtFrom || !updatedAtTo) {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      updatedAtFrom = updatedAtFrom ?? new Date(y, m, 1, 0, 0, 0, 0);
      updatedAtTo = updatedAtTo ?? new Date(y, m + 1, 0, 23, 59, 59, 999);
    } else if (!query.updatedAtTo?.includes('T') && !query.updatedAtTo?.includes(' ')) {
      updatedAtTo = new Date(query.updatedAtTo + 'T23:59:59.999Z');
    }

    const where: any = {
      fulfillmentStatus: FulfillmentStatus.CANCELED,
      updatedAt: { [Op.gte]: updatedAtFrom, [Op.lte]: updatedAtTo },
    };

    const { count, rows } = await this.orderModel.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer' },
        { model: OrderItem, as: 'orderItems', include: [{ model: Product, as: 'product' }] },
        { model: OrderDiscount, as: 'orderDiscounts' },
      ],
      order: [['updatedAt', 'DESC'], ['placedAt', 'DESC']],
      limit,
      offset,
    });

    return this.paginationService.createPaginatedResponse(
      rows.map((o) => o.toJSON()),
      count,
      { page, limit },
    );
  }

  async findOneOrder(id: number): Promise<Order> {
    // Validate id
    const orderId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(orderId) || orderId <= 0) {
      throw new NotFoundException(`Invalid order ID: ${id}`);
    }

    const order = await this.orderModel.findByPk(orderId, {
      include: [
        { model: Customer, as: 'customer' },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }],
        },
        { model: OrderDiscount, as: 'orderDiscounts' },
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return order;
  }


  // Track Order by Phone Number or Order Number
  async trackOrder(trackOrderDto: TrackOrderDto): Promise<Order | Order[]> {
    // Validate that at least one search parameter is provided
    if (!trackOrderDto.orderNumber && !trackOrderDto.phoneNumber) {
      throw new BadRequestException(
        'Either orderNumber or phoneNumber must be provided',
      );
    }

    // Track by order number
    if (trackOrderDto.orderNumber) {
      const order = await this.orderModel.findOne({
        where: {
          orderNumber: trackOrderDto.orderNumber,
        },
        include: [
          { model: Customer },
          {
            model: OrderItem,
            include: [Product],
          },
          { model: OrderDiscount, as: 'orderDiscounts' },
        ],
        order: [['placedAt', 'DESC']],
      });

      if (!order) {
        throw new NotFoundException(
          `Order with number ${trackOrderDto.orderNumber} not found`,
        );
      }

      return order;
    }

    // Track by phone number - return all orders for that customer
    if (trackOrderDto.phoneNumber) {
      // Find customer by phone number
      const customer = await this.customerService.findCustomerByPhoneNumber(
        trackOrderDto.phoneNumber,
      );

      if (!customer) {
        throw new NotFoundException(
          `No customer found with phone number ${trackOrderDto.phoneNumber}`,
        );
      }

      // Find all orders for this customer
      const orders = await this.orderModel.findAll({
        where: {
          customerId: customer.id,
        },
        include: [
          { model: Customer },
          {
            model: OrderItem,
            include: [Product],
          },
          { model: OrderDiscount, as: 'orderDiscounts' },
        ],
        order: [['placedAt', 'DESC']],
      });

      if (orders.length === 0) {
        throw new NotFoundException(
          `No orders found for phone number ${trackOrderDto.phoneNumber}`,
        );
      }

      return orders;
    }

    // This should never be reached due to validation above, but TypeScript needs it
    throw new BadRequestException('Invalid tracking parameters');
  }

  async updateOrder(
    id: number,
    updateOrderDto: UpdateOrderDto,
  ): Promise<Order> {
    const order = await this.findOneOrder(id);

    // If order is delivered or canceled, don't allow updates
    if (
      order.fulfillmentStatus === FulfillmentStatus.DELIVERED ||
      order.fulfillmentStatus === FulfillmentStatus.CANCELED
    ) {
      throw new BadRequestException(
        'Cannot update an order that has been delivered or canceled',
      );
    }

    // Recalculate total if items or shipping changed
    if (updateOrderDto.orderItems || updateOrderDto.deliveryCost !== undefined) {
      let totalPayable = updateOrderDto.deliveryCost ?? order.deliveryCost;
      let subTotal = 0;

      if (updateOrderDto.orderItems) {
        // Delete existing items
        await this.orderItemModel.destroy({
          where: { orderId: id },
        });

        // Create new items
        for (const itemDto of updateOrderDto.orderItems) {
          const product = await this.productModel.findByPk(
            itemDto.productId,
          );
          if (!product) {
            throw new NotFoundException(
              `Product with ID ${itemDto.productId} not found`,
            );
          }

          const lineTotal =
            itemDto.quantity * itemDto.unitPrice -
            (itemDto.discountApplied || 0);
          subTotal += lineTotal;
          totalPayable += lineTotal;

          await this.orderItemModel.create({
            orderId: id,
            productId: itemDto.productId,
            quantity: itemDto.quantity,
            unitPrice: itemDto.unitPrice,
            discountApplied: itemDto.discountApplied || 0,
            lineTotal,
          });
        }
      } else {
        // Recalculate from existing items
        const items = await this.orderItemModel.findAll({
          where: { orderId: id },
        });
        subTotal = items.reduce(
          (sum, item) => sum + parseFloat(item.lineTotal.toString()),
          0,
        );
        totalPayable = subTotal - (order.discount || 0) + (updateOrderDto.deliveryCost ?? order.deliveryCost);
      }

      await order.update({ 
        subTotal,
        totalPayable,
        discount: updateOrderDto.discount ?? order.discount,
      });
    }

    if (updateOrderDto.internalNotes !== undefined) {
      await order.update({ internalNotes: updateOrderDto.internalNotes });
    }

    if (updateOrderDto.deliveryNotes !== undefined) {
      await order.update({ deliveryNotes: updateOrderDto.deliveryNotes });
    }

    // Handle voucher code update and affiliate linking
    if (updateOrderDto.voucherCode !== undefined) {
      const updateData: any = {
        voucherCode: updateOrderDto.voucherCode || null,
      };

      // Link affiliate marketer if voucher code is provided
      if (updateOrderDto.voucherCode) {
        const affiliateLink = await this.orderPlacementSupport.linkAffiliateMarketerByVoucherCode(
          updateOrderDto.voucherCode,
        );

        if (affiliateLink) {
          updateData.affiliateId = affiliateLink.affiliateId;

          // Check if affiliate commission already exists for this order
          const existingCommission = await this.affiliateCommissionModel.findOne({
            where: { orderId: id },
          });

          if (!existingCommission && affiliateLink.commissionPercentage > 0) {
            // Calculate order total before discount for commission
            const orderItems = await this.orderItemModel.findAll({
              where: { orderId: id },
            });
            const orderTotalBeforeDiscount = orderItems.reduce(
              (sum, item) => sum + parseFloat(item.unitPrice.toString()) * item.quantity,
              parseFloat(order.deliveryCost?.toString() || '0'),
            );

            const commissionAmount =
              (orderTotalBeforeDiscount * affiliateLink.commissionPercentage) / 100;

            // Create affiliate commission record
            await this.affiliateCommissionModel.create({
              affiliateId: affiliateLink.affiliateId,
              orderId: id,
              orderTotal: orderTotalBeforeDiscount,
              commissionAmount,
              commissionPercentage: affiliateLink.commissionPercentage,
              orderDate: order.placedAt,
              paymentStatus: order.paymentStatus,
            });

            this.logger.log(
              `[Affiliate Commission] Created commission for affiliate ${affiliateLink.affiliateId} on order ${id}: ${commissionAmount} (${affiliateLink.commissionPercentage}% of ${orderTotalBeforeDiscount})`,
            );
          } else if (existingCommission && existingCommission.affiliateId !== affiliateLink.affiliateId) {
            // Update existing commission if affiliate changed
            const orderItems = await this.orderItemModel.findAll({
              where: { orderId: id },
            });
            const orderTotalBeforeDiscount = orderItems.reduce(
              (sum, item) => sum + parseFloat(item.unitPrice.toString()) * item.quantity,
              parseFloat(order.deliveryCost?.toString() || '0'),
            );

            const commissionAmount =
              (orderTotalBeforeDiscount * affiliateLink.commissionPercentage) / 100;

            await existingCommission.update({
              affiliateId: affiliateLink.affiliateId,
              orderTotal: orderTotalBeforeDiscount,
              commissionAmount,
              commissionPercentage: affiliateLink.commissionPercentage,
            });

            this.logger.log(
              `[Affiliate Commission] Updated commission for affiliate ${affiliateLink.affiliateId} on order ${id}: ${commissionAmount} (${affiliateLink.commissionPercentage}% of ${orderTotalBeforeDiscount})`,
            );
          }
        } else {
          // Remove affiliate link if voucher code doesn't belong to an affiliate
          updateData.affiliateId = null;
        }
      } else {
        // Remove affiliate link if voucher code is removed
        updateData.affiliateId = null;
      }

      await order.update(updateData);
    }

    return this.findOneOrder(id);
  }

  async updateOrderStatus(
    id: number,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.findOneOrder(id);

    const updateData: any = {};
    let statusChanged = false;

    if (updateOrderStatusDto.fulfillmentStatus) {
      this.validateStatusTransition(order.fulfillmentStatus, updateOrderStatusDto.fulfillmentStatus, order.fulfillmentType);
      updateData.fulfillmentStatus = updateOrderStatusDto.fulfillmentStatus;
      statusChanged = true;

      // Handle side effects
      if (updateOrderStatusDto.fulfillmentStatus === FulfillmentStatus.DELIVERED) {
        // Increment product sales count when order is delivered
        await this.incrementProductSalesCount(id);
      }
    }

    if (updateOrderStatusDto.paymentStatus) {
      // When moving to PAID: create PaymentReceipt for remaining and sync order (do not set payment fields in updateData)
      if (updateOrderStatusDto.paymentStatus === PaymentStatus.PAID) {
        const totalPayable = parseFloat(String(order.totalPayable));
        const totalPaid = await this.paymentReceiptService.getTotalPaidForOrder(id);
        const remaining = totalPayable - totalPaid;
        if (remaining > 0) {
          const method = updateOrderStatusDto.paymentMethod || order.paymentMethod;
          if (!method) {
            throw new BadRequestException('paymentMethod is required when setting payment status to PAID (to record the payment)');
          }
          const paidAt = updateOrderStatusDto.paidAt ? new Date(updateOrderStatusDto.paidAt) : new Date();
          await this.paymentReceiptService.createPaymentReceipt(id, {
            amount: remaining,
            paymentMethod: method,
            paidAt,
            notes: updateOrderStatusDto.internalNotes,
          });
        }
        // Payment fields are set by createPaymentReceipt/sync; do not add to updateData
      } else {
        updateData.paymentStatus = updateOrderStatusDto.paymentStatus;
        updateData.paidAt = null;
        updateData.paymentMethod = updateOrderStatusDto.paymentMethod || order.paymentMethod;
      }
      statusChanged = true;
    }

    if (updateOrderStatusDto.internalNotes) {
      updateData.internalNotes = updateOrderStatusDto.internalNotes
        ? `${order.internalNotes || ''}\n${updateOrderStatusDto.internalNotes}`.trim()
        : order.internalNotes;
    }

    await order.update(updateData);
    return this.findOneOrder(id);
  }

  async processPayment(
    id: number,
    processPaymentDto: ProcessPaymentDto,
    skipSms: boolean = false,
  ): Promise<Order> {
    this.logger.log(
      `[Process Payment] ========================================`,
    );
    this.logger.log(
      `[Process Payment] Processing payment for order ${id}`,
    );
    this.logger.log(
      `[Process Payment] Payment Method: ${processPaymentDto.paymentMethod}`,
    );
    this.logger.log(
      `[Process Payment] Payment Date: ${processPaymentDto.paymentDate || 'not provided'}`,
    );

    const order = await this.findOneOrder(id);

    this.logger.log(
      `[Process Payment] Current Order Status:`,
    );
    this.logger.log(
      `[Process Payment]   Order Number: ${order.orderNumber}`,
    );
    this.logger.log(
      `[Process Payment]   Payment Status: ${order.paymentStatus}`,
    );
    this.logger.log(
      `[Process Payment]   Fulfillment Status: ${order.fulfillmentStatus}`,
    );

    if (order.fulfillmentStatus !== FulfillmentStatus.PLACED && 
        order.fulfillmentStatus !== FulfillmentStatus.PROCESSING) {
      throw new BadRequestException(
        'Payment can only be processed for placed or processing orders',
      );
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Payment has already been processed');
    }

    const paymentDate = processPaymentDto.paymentDate
      ? new Date(processPaymentDto.paymentDate)
      : new Date();

    if (paymentDate < order.placedAt) {
      throw new BadRequestException('Payment date cannot be before order placed date');
    }

    // Use updatePaymentStatus to trigger SMS templates
    this.logger.log(
      `[Process Payment] Executing updatePaymentStatus to set status to PAID`,
    );
    const updatedOrder = await this.updatePaymentStatus(id, {
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: processPaymentDto.paymentMethod,
      paidAt: processPaymentDto.paymentDate,
      internalNotes: processPaymentDto.internalNotes,
    });

    this.logger.log(
      `[Process Payment] Payment status updated successfully`,
    );

    return this.findOneOrder(id);
  }


  // Increment product sales count when order is delivered
  private async incrementProductSalesCount(orderId: number): Promise<void> {
    try {
      const order = await this.findOneOrder(orderId);

      if (!order.orderItems || order.orderItems.length === 0) {
        return;
      }

      // Increment sales count for each product in the order
      for (const item of order.orderItems) {
        if (item.productId) {
          const product = await this.productModel.findByPk(item.productId);
          if (product) {
            // Increment sales count by the quantity ordered
            await product.update({
              salesCount: (product.salesCount || 0) + item.quantity,
            });
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to increment product sales count for order ${orderId}:`,
        error.message,
      );
      // Don't throw - this is a side effect that shouldn't fail the order update
    }
  }

  // Status Management Methods
  async updateFulfillmentStatus(
    id: number,
    updateFulfillmentStatusDto: UpdateFulfillmentStatusDto,
    skipSms: boolean = false,
  ): Promise<Order> {
    const order = await this.orderModel.findByPk(id, {
      include: [{ model: Customer, as: 'customer' }],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Validate status transition (basic validation)
    if (order.fulfillmentStatus === updateFulfillmentStatusDto.fulfillmentStatus) {
      return order; // No change needed
    }

    this.validateStatusTransition(
      order.fulfillmentStatus,
      updateFulfillmentStatusDto.fulfillmentStatus,
      order.fulfillmentType,
    );

    return this.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const newStatus = updateFulfillmentStatusDto.fulfillmentStatus;
      
      // Prepare update data with status and timestamp
      const updateData: any = {
        fulfillmentStatus: newStatus,
        internalNotes: updateFulfillmentStatusDto.internalNotes
          ? `${order.internalNotes || ''}\n${updateFulfillmentStatusDto.internalNotes}`.trim()
          : order.internalNotes,
      };

      // Set appropriate timestamp based on status
      switch (newStatus) {
        case FulfillmentStatus.CONFIRMED:
          updateData.confirmedAt = now;
          break;
        case FulfillmentStatus.PROCESSING:
          updateData.processingAt = now;
          break;
        case FulfillmentStatus.SHIPPING:
          updateData.shippingAt = now;
          // Set driver information if provided
          if (updateFulfillmentStatusDto.driverName) {
            updateData.driverName = updateFulfillmentStatusDto.driverName;
          }
          if (updateFulfillmentStatusDto.driverPhone) {
            updateData.driverPhone = updateFulfillmentStatusDto.driverPhone;
          }
          if (updateFulfillmentStatusDto.vehicleNumber) {
            updateData.vehicleNumber = updateFulfillmentStatusDto.vehicleNumber;
          }
          break;
        case FulfillmentStatus.DELIVERED:
          updateData.deliveredAt = now;
          break;
        case FulfillmentStatus.CANCELED:
          updateData.canceledAt = now;
          break;
      }

      await order.update(updateData, { transaction });

      const savedOrder = await this.orderModel.findByPk(order.id, {
        include: [{ model: Customer, as: 'customer' }],
        transaction,
      });

      // Determine trigger event for SMS (only if not skipped)
      if (!skipSms) {
        const trigger = this.smsTriggerService.getTriggerEvent(
          order.fulfillmentStatus,
          updateFulfillmentStatusDto.fulfillmentStatus,
          order.paymentStatus, // Pass current payment status
          savedOrder.paymentStatus, // Pass updated payment status (should be same)
        );

        // Trigger SMS templates if trigger exists
        if (trigger) {
          this.logger.log(
            `[Update Fulfillment Status] Triggering SMS templates with event: ${trigger}`,
          );
          this.smsTriggerService
            .processSmsTemplates(savedOrder, trigger)
            .then(() => {
              this.logger.log(
                `[Update Fulfillment Status] ✅ Successfully queued SMS templates for order ${savedOrder.id}`,
              );
            })
            .catch((error) => {
              this.logger.error(
                `[Update Fulfillment Status] ❌ Failed to process SMS templates for order ${savedOrder.id}:`,
                error,
              );
            });
        } else {
          this.logger.log(
            `[Update Fulfillment Status] No SMS trigger event for status change: ${order.fulfillmentStatus} → ${updateFulfillmentStatusDto.fulfillmentStatus}`,
          );
        }
      } else {
        this.logger.log(
          `[Update Fulfillment Status] SMS templates skipped (skipSms=true)`,
        );
      }

      // Handle side effects (product sales count increment)
      if (updateFulfillmentStatusDto.fulfillmentStatus === FulfillmentStatus.DELIVERED) {
        await this.incrementProductSalesCount(id);
      }

      return savedOrder;
    });
  }

  async markOrderAsDelivered(
    id: number,
    markDeliveredDto?: MarkDeliveredDto,
  ): Promise<Order> {
    const order = await this.orderModel.findByPk(id, {
      include: [{ model: Customer, as: 'customer' }],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.fulfillmentStatus !== FulfillmentStatus.SHIPPING) {
      throw new BadRequestException(
        `Cannot mark order as delivered. Current status: ${order.fulfillmentStatus}. Expected: ${FulfillmentStatus.SHIPPING}`,
      );
    }

    // Generate feedback token
    const feedbackToken = uuidv4();
    const now = new Date();

    return this.sequelize.transaction(async (transaction) => {
      const updateData: any = {
        fulfillmentStatus: FulfillmentStatus.DELIVERED,
        deliveredAt: now,
        feedbackToken,
      };

      // Update internal notes if provided
      if (markDeliveredDto?.internalNotes) {
        updateData.internalNotes = markDeliveredDto.internalNotes
          ? `${order.internalNotes || ''}\nOrder Delivered: ${markDeliveredDto.internalNotes}`.trim()
          : order.internalNotes;
      }

      await order.update(updateData, { transaction });

      const savedOrder = await this.orderModel.findByPk(order.id, {
        include: [{ model: Customer, as: 'customer' }],
        transaction,
      });

      // Generate feedback link
      const frontendUrl = process.env.FRONTEND_URL || 'https://yoursite.com';
      const feedbackLink = `${frontendUrl}/feedback/${feedbackToken}`;

      // Trigger SMS templates with feedback link
      this.smsTriggerService
        .processSmsTemplates(savedOrder, SmsTriggerEvent.SHIPPING_TO_DELIVERED, {
          feedbackLink,
        })
        .catch((error) => {
          this.logger.error(
            `Failed to process SMS templates for order ${savedOrder.id}:`,
            error,
          );
        });

      // Handle side effects
      await this.incrementProductSalesCount(id);

      return savedOrder;
    });
  }

  async updatePaymentStatus(
    id: number,
    updatePaymentStatusDto: UpdatePaymentStatusDto,
  ): Promise<Order> {
    this.logger.log(
      `[Update Payment Status] ========================================`,
    );
    this.logger.log(
      `[Update Payment Status] Processing payment status update for order ${id}`,
    );
    this.logger.log(
      `[Update Payment Status] New Payment Status: ${updatePaymentStatusDto.paymentStatus}`,
    );
    this.logger.log(
      `[Update Payment Status] Payment Method: ${updatePaymentStatusDto.paymentMethod || 'not provided'}`,
    );
    this.logger.log(
      `[Update Payment Status] Transaction ID: ${updatePaymentStatusDto.transactionId || 'not provided'}`,
    );

    const order = await this.orderModel.findByPk(id, {
      include: [{ model: Customer, as: 'customer' }],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    this.logger.log(`[Update Payment Status] Current Order Status:`);
    this.logger.log(`[Update Payment Status]   Order Number: ${order.orderNumber}`);
    this.logger.log(`[Update Payment Status]   Current Payment Status: ${order.paymentStatus}`);
    this.logger.log(`[Update Payment Status]   Current Fulfillment Status: ${order.fulfillmentStatus}`);
    this.logger.log(`[Update Payment Status]   Customer: ${order.customer?.name || 'N/A'} (ID: ${order.customerId})`);

    const oldStatus = order.paymentStatus;

    return this.sequelize.transaction(async (transaction) => {
      const previousPaymentStatus = order.paymentStatus;
      const now = new Date();

      this.logger.log(`[Update Payment Status] Previous Payment Status: ${previousPaymentStatus}`);
      this.logger.log(`[Update Payment Status] Payment Status Changed: ${previousPaymentStatus} → ${updatePaymentStatusDto.paymentStatus}`);

      // When moving to PAID: create PaymentReceipt for remaining amount (if any) and sync order
      if (updatePaymentStatusDto.paymentStatus === PaymentStatus.PAID) {
        const totalPayable = parseFloat(String(order.totalPayable));
        const totalPaid = await this.paymentReceiptService.getTotalPaidForOrder(id, transaction);
        const remaining = totalPayable - totalPaid;

        if (remaining > 0) {
          const method = updatePaymentStatusDto.paymentMethod || order.paymentMethod;
          if (!method) {
            throw new BadRequestException('paymentMethod is required when recording a payment to set status PAID');
          }
          const paidAt = updatePaymentStatusDto.paidAt ? new Date(updatePaymentStatusDto.paidAt) : now;
          await this.paymentReceiptService.createPaymentReceipt(
            id,
            {
              amount: remaining,
              paymentMethod: method,
              paidAt,
              transactionId: updatePaymentStatusDto.transactionId,
              notes: updatePaymentStatusDto.internalNotes,
            },
            transaction,
          );
        }
      }

      // Fulfillment: when PAID and PLACED -> CONFIRMED
      let newFulfillmentStatus = order.fulfillmentStatus;
      let confirmedAt = order.confirmedAt;
      if (
        updatePaymentStatusDto.paymentStatus === PaymentStatus.PAID &&
        order.fulfillmentStatus === FulfillmentStatus.PLACED
      ) {
        newFulfillmentStatus = FulfillmentStatus.CONFIRMED;
        confirmedAt = now;
        this.logger.log(`[Update Payment Status] Payment is PAID and order is PLACED → Auto-updating fulfillment to CONFIRMED`);
      }

      // Build updateData: for PAID, payment fields come from createPaymentReceipt/sync; only fulfillment+confirmedAt
      const updateData: any = { fulfillmentStatus: newFulfillmentStatus, confirmedAt };
      if (updatePaymentStatusDto.paymentStatus !== PaymentStatus.PAID) {
        updateData.paymentStatus = updatePaymentStatusDto.paymentStatus;
        updateData.paidAt = null;
        updateData.paymentMethod = updatePaymentStatusDto.paymentMethod || order.paymentMethod;
      }

      this.logger.log(`[Update Payment Status] Updating order with new statuses...`);
      await order.update(updateData, { transaction });

      const savedOrder = await this.orderModel.findByPk(order.id, {
        include: [{ model: Customer, as: 'customer' }],
        transaction,
      });

      this.logger.log(`[Update Payment Status] Order updated successfully`);
      this.logger.log(`[Update Payment Status] Final Payment Status: ${savedOrder.paymentStatus}`);
      this.logger.log(`[Update Payment Status] Final Fulfillment Status: ${savedOrder.fulfillmentStatus}`);

      // Determine trigger event for SMS based on both payment and fulfillment status changes
      const oldFulfillmentStatus = order.fulfillmentStatus;
      const updatedFulfillmentStatus = savedOrder.fulfillmentStatus;

      const trigger = this.smsTriggerService.getTriggerEvent(
        oldFulfillmentStatus,
        updatedFulfillmentStatus,
        previousPaymentStatus,
        updatePaymentStatusDto.paymentStatus,
      );

      // Skip SMS templates for COUNTER; counter flows use their own non-template SMS.
      if (trigger && savedOrder.orderSource !== OrderSource.COUNTER) {
        this.logger.log(`[Update Payment Status] Triggering SMS templates with event: ${trigger}`);
        this.smsTriggerService
          .processSmsTemplates(savedOrder, trigger)
          .then(() => this.logger.log(`[Update Payment Status] ✅ Queued SMS templates for order ${savedOrder.id}`))
          .catch((e) => this.logger.error(`[Update Payment Status] ❌ order ${savedOrder.id}: ${(e as Error)?.message}`, (e as Error)?.stack));
      } else if (!trigger) {
        this.logger.log(`[Update Payment Status] ⚠️  No SMS trigger event for status changes`);
      }

      this.logger.log(`[Update Payment Status] ========================================`);
      return savedOrder;
    });
  }

  /**
   * Confirm an order - Admin and Staff only
   * Updates payment status to PAID and fulfillment status from PLACED to CONFIRMED
   * @param id - Order ID
   * @param confirmOrderDto - Payment details (method, transactionId, internalNotes)
   * @returns Updated Order
   */
  async confirmOrder(
    id: number,
    confirmOrderDto: ConfirmOrderDto,
  ): Promise<Order> {
    this.logger.log(
      `[Confirm Order] ========================================`,
    );
    this.logger.log(
      `[Confirm Order] Confirming order ${id}`,
    );
    this.logger.log(
      `[Confirm Order] Payment Method: ${confirmOrderDto.paymentMethod}`,
    );
    this.logger.log(
      `[Confirm Order] Transaction ID: ${confirmOrderDto.transactionId || 'not provided'}`,
    );

    const order = await this.findOneOrder(id);

    // Validate order is in PLACED status
    if (order.fulfillmentStatus !== FulfillmentStatus.PLACED) {
      throw new BadRequestException(
        `Cannot confirm order. Order must be in PLACED status. Current status: ${order.fulfillmentStatus}`,
      );
    }

    // Validate payment status is PENDING
    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        `Cannot confirm order. Payment status must be PENDING. Current status: ${order.paymentStatus}`,
      );
    }

    this.logger.log(
      `[Confirm Order] Order ${order.orderNumber} is valid for confirmation`,
    );

    // Use updatePaymentStatus to handle the status change and trigger SMS
    const updatedOrder = await this.updatePaymentStatus(id, {
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: confirmOrderDto.paymentMethod,
      transactionId: confirmOrderDto.transactionId,
      internalNotes: confirmOrderDto.internalNotes,
    });

    // Update internal notes separately if provided
    if (confirmOrderDto.internalNotes) {
      const notesUpdate = `${order.internalNotes || ''}\nOrder Confirmed: ${confirmOrderDto.internalNotes}`.trim();
      await updatedOrder.update({
        internalNotes: notesUpdate,
      });
    }

    const finalOrder = await this.findOneOrder(id);
    this.logger.log(
      `[Confirm Order] Order ${finalOrder.orderNumber} confirmed successfully`,
    );
    this.logger.log(
      `[Confirm Order] Payment Status: ${finalOrder.paymentStatus}, Fulfillment Status: ${finalOrder.fulfillmentStatus}`,
    );
    this.logger.log(
      `[Confirm Order] ========================================`,
    );

    return finalOrder;
  }

  /**
   * Ship an order - Admin and Staff only
   * Updates fulfillment status to SHIPPING and sets delivery driver information
   * @param id - Order ID
   * @param shipOrderDto - Delivery driver details and estimated delivery date
   * @returns Updated Order
   */
  async shipOrder(
    id: number,
    shipOrderDto: ShipOrderDto,
  ): Promise<Order> {
    this.logger.log(
      `[Ship Order] ========================================`,
    );
    this.logger.log(
      `[Ship Order] Shipping order ${id}`,
    );
    this.logger.log(
      `[Ship Order] Driver Name: ${shipOrderDto.driverName}`,
    );
    this.logger.log(
      `[Ship Order] Vehicle Number: ${shipOrderDto.vehicleNumber}`,
    );
    this.logger.log(
      `[Ship Order] Expected Delivery Date: ${shipOrderDto.expectedDeliveryDate}`,
    );

    const order = await this.findOneOrder(id);

    // Validate order is in a valid status for shipping (CONFIRMED or PROCESSING)
    if (
      order.fulfillmentStatus === FulfillmentStatus.SHIPPING || order.fulfillmentStatus === FulfillmentStatus.CANCELED
     ) {
      throw new BadRequestException(
        `Cannot ship order. Order is already ${order.fulfillmentStatus}`,
      );
    }
 
    this.logger.log(
      `[Ship Order] Order ${order.orderNumber} is valid for shipping`,
    );

    const now = new Date();
    const expectedDeliveryDate = new Date(shipOrderDto.expectedDeliveryDate);

    // Validate expected delivery date is in the future
    if (expectedDeliveryDate <= now) {
      throw new BadRequestException(
        'Expected delivery date must be in the future',
      );
    }

    return this.sequelize.transaction(async (transaction) => {
      // Prepare update data
      const updateData: any = {
        fulfillmentStatus: FulfillmentStatus.SHIPPING,
        shippingAt: now,
        driverName: shipOrderDto.driverName,
        vehicleNumber: shipOrderDto.vehicleNumber,
        expectedDeliveryDate: expectedDeliveryDate,
      };

      if (shipOrderDto.driverPhone) {
        updateData.driverPhone = shipOrderDto.driverPhone;
      }

      if (shipOrderDto.deliveryNotes !== undefined) {
        updateData.deliveryNotes = shipOrderDto.deliveryNotes;
      }

      await order.update(updateData, { transaction });

      const savedOrder = await this.orderModel.findByPk(order.id, {
        include: [
          { model: Customer, as: 'customer' },
          { model: OrderItem, as: 'orderItems' },
          { model: OrderDiscount, as: 'orderDiscounts' },
        ],
        transaction,
      });

      // Send SMS directly with driver and vehicle details
      const customer = savedOrder.customer as Customer;
      if (customer?.phoneNumber) {
        try {
          // Format expected delivery date
          const deliveryDate = new Date(expectedDeliveryDate);
          const formattedDate = deliveryDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          const formattedTime = deliveryDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });

          // Build SMS message
          let smsMessage = `Your order ${savedOrder.orderNumber} is out for delivery!\n\n`;
          smsMessage += `Driver: ${shipOrderDto.driverName}\n`;
          if (shipOrderDto.driverPhone) {
            smsMessage += `Driver Phone: ${shipOrderDto.driverPhone}\n`;
          }
          smsMessage += `Vehicle: ${shipOrderDto.vehicleNumber}\n`;
          smsMessage += `Expected Delivery: ${formattedDate} at ${formattedTime}\n\n`;
          smsMessage += `Thank you for your order!`;

          const smsData: SendSmsNotificationDto = {
            phoneNumber: customer.phoneNumber,
            message: smsMessage,
          };

          this.logger.log(
            `[Ship Order] Sending SMS to ${customer.phoneNumber} for order ${savedOrder.orderNumber}`,
          );

          const smsResult = await this.smsService.sendSmsNotification(smsData);

          if (smsResult.success) {
            this.logger.log(
              `[Ship Order] ✅ SMS sent successfully to ${customer.phoneNumber}`,
            );
          } else {
            this.logger.error(
              `[Ship Order] ❌ Failed to send SMS to ${customer.phoneNumber}: ${smsResult.message}`,
            );
            // Log additional details for 502 errors (Bad Gateway - SMS API server issue)
            if (smsResult.message?.includes('502') || smsResult.message?.includes('Bad Gateway')) {
              this.logger.warn(
                `[Ship Order] ⚠️  SMS API server returned 502 Bad Gateway. This may be a temporary issue with the SMS service. Order was still updated successfully.`,
              );
            }
          }
        } catch (error) {
          this.logger.error(
            `[Ship Order] ❌ Exception while sending SMS to ${customer.phoneNumber}: ${error.message || error}`,
            error.stack,
          );
          // Don't throw - SMS failure shouldn't fail the order update
        }
      } else {
        this.logger.warn(
          `[Ship Order] ⚠️  No phone number found for customer ${customer?.id || 'N/A'}, skipping SMS`,
        );
      }

      this.logger.log(
        `[Ship Order] Order ${savedOrder.orderNumber} shipped successfully`,
      );
      this.logger.log(
        `[Ship Order] Fulfillment Status: ${savedOrder.fulfillmentStatus}`,
      );
      this.logger.log(
        `[Ship Order] Expected Delivery Date: ${savedOrder.expectedDeliveryDate}`,
      );
      this.logger.log(
        `[Ship Order] ========================================`,
      );

      return savedOrder;
    });
  }

  async updatePaymentMethod(
    id: number,
    updatePaymentMethodDto: UpdatePaymentMethodDto,
  ): Promise<Order> {
    const order = await this.findOneOrder(id);

    // Cannot update payment method if order is delivered or canceled
    if (
      order.fulfillmentStatus === FulfillmentStatus.DELIVERED ||
      order.fulfillmentStatus === FulfillmentStatus.CANCELED
    ) {
      throw new BadRequestException(
        'Cannot update payment method for delivered or canceled orders',
      );
    }

    // Cannot update if payment is already PAID
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException(
        'Cannot update payment method for orders that are already paid',
      );
    }

    // If ZPSS is selected, auto-verify and set to PAID via updatePaymentStatus (creates PaymentReceipt and syncs)
    if (updatePaymentMethodDto.paymentMethod === PaymentMethod.ZPSS) {
      this.logger.log(
        `[Update Payment Method] ZPSS payment method selected - auto-setting payment to PAID`,
      );
      const paidOrder = await this.updatePaymentStatus(id, {
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.ZPSS,
      });
      if (updatePaymentMethodDto.internalNotes) {
        await paidOrder.update({
          internalNotes: `${paidOrder.internalNotes || ''}\nPayment Method Updated: ${updatePaymentMethodDto.internalNotes}`.trim(),
        });
      }
      return this.findOneOrder(id);
    }

    // Non-ZPSS: just update payment method and optional notes
    const updateData: any = { paymentMethod: updatePaymentMethodDto.paymentMethod };
    if (updatePaymentMethodDto.internalNotes) {
      updateData.internalNotes = updatePaymentMethodDto.internalNotes
        ? `${order.internalNotes || ''}\nPayment Method Updated: ${updatePaymentMethodDto.internalNotes}`.trim()
        : order.internalNotes;
    }
    await order.update(updateData);
    return this.findOneOrder(id);
  }

  async verifyOrder(id: number, verifyOrderDto: VerifyOrderDto): Promise<Order> {
    const order = await this.findOneOrder(id);

    // Check if payment method is set
    if (!order.paymentMethod) {
      throw new BadRequestException('Payment method must be set before verification');
    }

    // Check if verification is required
    if (!this.shouldRequireVerification(order.paymentMethod)) {
      throw new BadRequestException('This payment method does not require verification');
    }

    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException('Order is already verified or payment status is not PENDING');
    }

    this.logger.log(
      `[Verify Order] Verifying order ${id} - setting payment status to PAID`,
    );
    // Use updatePaymentStatus to trigger SMS templates
    const updatedOrder = await this.updatePaymentStatus(id, {
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: order.paymentMethod,
    });

    this.logger.log(
      `[Verify Order] Order verified successfully`,
    );

    // Update internal notes if provided
    if (verifyOrderDto.internalNotes) {
      await updatedOrder.update({
        internalNotes: `${updatedOrder.internalNotes || ''}\nVerification: ${verifyOrderDto.internalNotes}`.trim(),
      });
    }

    return this.findOneOrder(id);
  }

  // Workflow Logic Methods
  private validateStatusTransition(
    currentStatus: FulfillmentStatus,
    newStatus: FulfillmentStatus,
    fulfillmentType?: FulfillmentType,
  ): void {
    // PICKUP/INSTORE: customer collects at shop; CONFIRMED or PROCESSING → DELIVERED is allowed
    if (
      newStatus === FulfillmentStatus.DELIVERED &&
      (fulfillmentType === FulfillmentType.PICKUP || fulfillmentType === FulfillmentType.INSTORE) &&
      (currentStatus === FulfillmentStatus.CONFIRMED || currentStatus === FulfillmentStatus.PROCESSING)
    ) {
      return;
    }

    const validTransitions: Record<FulfillmentStatus, FulfillmentStatus[]> = {
      [FulfillmentStatus.PLACED]: [FulfillmentStatus.CONFIRMED, FulfillmentStatus.CANCELED],
      [FulfillmentStatus.CONFIRMED]: [
        FulfillmentStatus.PROCESSING,
        FulfillmentStatus.CANCELED,
      ],
      [FulfillmentStatus.PROCESSING]: [
        FulfillmentStatus.SHIPPING,
        FulfillmentStatus.CANCELED,
      ],
      [FulfillmentStatus.SHIPPING]: [FulfillmentStatus.DELIVERED, FulfillmentStatus.CANCELED],
      [FulfillmentStatus.DELIVERED]: [],
      [FulfillmentStatus.CANCELED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  private shouldRequireVerification(paymentMethod: PaymentMethod): boolean {
    // ZPSS does not require verification
    return paymentMethod !== PaymentMethod.ZPSS;
  }

  getCustomerStatusMessage(order: Order): GetCustomerStatusDto {
    const fulfillmentStatus = order.fulfillmentStatus;
    const paymentStatus = order.paymentStatus;
    const paymentMethod = order.paymentMethod;

    let message = '';
    let trackingNumber: string | undefined;

    // Determine customer message based on status combination
    if (fulfillmentStatus === FulfillmentStatus.PLACED && paymentStatus === PaymentStatus.PENDING) {
      message = 'Awaiting Verification. Your order requires confirmation before processing can begin.';
    } else if (
      fulfillmentStatus === FulfillmentStatus.CONFIRMED &&
      paymentStatus === PaymentStatus.PENDING
    ) {
      message = "Order Under Review. We're verifying your payment details.";
    } else if (
      fulfillmentStatus === FulfillmentStatus.PROCESSING &&
      paymentStatus === PaymentStatus.PAID
    ) {
      message = "Processing Your Order. We're preparing your items.";
    } else if (
      fulfillmentStatus === FulfillmentStatus.SHIPPING &&
      paymentStatus === PaymentStatus.PAID
    ) {
      message = `Out for Delivery! Your order has been shipped. Tracking: ${order.orderNumber}`;
      trackingNumber = order.orderNumber;
    } else if (
      fulfillmentStatus === FulfillmentStatus.SHIPPING &&
      paymentStatus === PaymentStatus.PENDING &&
      paymentMethod === PaymentMethod.CASH
    ) {
      message = `Out for Delivery! Tracking: ${order.orderNumber}. Please prepare exact payment for the courier.`;
      trackingNumber = order.orderNumber;
    } else if (
      fulfillmentStatus === FulfillmentStatus.DELIVERED &&
      paymentStatus === PaymentStatus.PAID
    ) {
      message = 'Delivered! Your order has been successfully delivered.';
    } else if (
      fulfillmentStatus === FulfillmentStatus.CANCELED &&
      paymentStatus === PaymentStatus.FAILED
    ) {
      message = 'Order Canceled. The payment or verification failed. Please contact support.';
    } else {
      message = `Order Status: ${fulfillmentStatus}, Payment: ${paymentStatus}`;
    }

    return {
      customerStatusMessage: message,
      fulfillmentStatus,
      paymentStatus,
      trackingNumber,
    };
  }

  // All SMS sending is now handled via the template system and outbox processor
  // SMS templates are triggered automatically in CQRS handlers based on order events
  // If no templates are defined for an event, no SMS will be sent

  async cancelOrder(id: number, reason?: string): Promise<Order> {
    const order = await this.findOneOrder(id);

    if (order.fulfillmentStatus === FulfillmentStatus.CANCELED) {
      return this.findOneOrder(id);
    }
    if (order.fulfillmentStatus === FulfillmentStatus.DELIVERED) {
      throw new BadRequestException(
        'Cannot cancel an order that has been delivered.',
      );
    }

    const now = new Date();
    await order.update({
      fulfillmentStatus: FulfillmentStatus.CANCELED,
      paymentStatus: PaymentStatus.FAILED,
      canceledAt: now,
      internalNotes: reason
        ? `${order.internalNotes || ''}\nCancellation: ${reason}`.trim()
        : order.internalNotes,
    });

    const canceledOrder = await this.findOneOrder(id);

    // SMS notifications are handled via templates in CQRS handlers
    // No direct SMS sending - all SMS goes through template system and outbox processor

    return canceledOrder;
  }


  async removeOrder(id: number): Promise<void> {
    const order = await this.findOneOrder(id);

    if (
      order.fulfillmentStatus === FulfillmentStatus.DELIVERED ||
      order.paymentStatus === PaymentStatus.PAID
    ) {
      throw new BadRequestException(
        'Cannot delete an order that has been delivered or paid. Use cancel instead.',
      );
    }

    // Delete line items
    await this.orderItemModel.destroy({
      where: { orderId: id },
    });

    // Delete order
    await order.destroy();
  }

  // Get Orders by Month
  async getOrdersByMonth(
    monthQuery: MonthQueryDto,
  ): Promise<OrdersByMonthResponseDto> {
    const { year, month } = monthQuery;

    // Calculate start and end dates for the month
    // Start date: First day of the month at 00:00:00
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    // End date: First day of next month (exclusive) - 1ms
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // Find all orders in the specified month
    const orders = await this.orderModel.findAll({
      where: {
        placedAt: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
      },
      include: [
        { model: Customer },
        {
          model: OrderItem,
          include: [Product],
        },
        { model: OrderDiscount, as: 'orderDiscounts' },
      ],
      order: [['placedAt', 'DESC']],
    });

    return {
      year,
      month,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalOrders: orders.length,
      orders,
    };
  }

  // Get Order Statistics by Month
  async getOrderStatisticsByMonth(
    monthQuery: MonthQueryDto,
  ): Promise<OrderStatisticsByMonthResponseDto> {
    const { year, month } = monthQuery;

    // Calculate start and end dates for the month
    // Start date: First day of the month at 00:00:00
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    // End date: First day of next month (exclusive) - 1ms
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // Find all orders in the specified month
    const orders = await this.orderModel.findAll({
      where: {
        placedAt: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
      },
      include: [{ model: Customer }],
    });

    // Initialize statistics
    const statistics: OrderStatisticsByMonthResponseDto = {
      year,
      month,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalOrders: orders.length,
      totalRevenue: 0,
      totalShippingCost: 0,
      averageOrderValue: 0,
      ordersByStatus: {
        [FulfillmentStatus.PLACED]: 0,
        [FulfillmentStatus.CONFIRMED]: 0,
        [FulfillmentStatus.PROCESSING]: 0,
        [FulfillmentStatus.SHIPPING]: 0,
        [FulfillmentStatus.DELIVERED]: 0,
        [FulfillmentStatus.CANCELED]: 0,
      },
      ordersByPaymentMethod: {},
      completedOrders: 0,
      completedRevenue: 0,
      cancelledOrders: 0,
      pendingOrders: 0,
    };

    // Calculate statistics
    for (const order of orders) {
      // Count by status
      statistics.ordersByStatus[order.fulfillmentStatus] =
        (statistics.ordersByStatus[order.fulfillmentStatus] || 0) + 1;

      // Count by payment method (only for completed orders)
      if (order.paymentMethod) {
        const methodKey = order.paymentMethod;
        statistics.ordersByPaymentMethod[methodKey] =
          (statistics.ordersByPaymentMethod[methodKey] || 0) + 1;
      }

      // Calculate revenue (from paid orders)
      if (order.paymentStatus === PaymentStatus.PAID) {
        statistics.totalRevenue += parseFloat(order.totalPayable.toString());
      }

      // Count completed orders (delivered)
      if (order.fulfillmentStatus === FulfillmentStatus.DELIVERED) {
        statistics.completedOrders += 1;
        if (order.paymentStatus === PaymentStatus.PAID) {
          statistics.completedRevenue += parseFloat(order.totalPayable.toString());
        }
      }

      if (order.fulfillmentStatus === FulfillmentStatus.CANCELED) {
        statistics.cancelledOrders += 1;
      }

      // Pending orders are those that are placed but not paid
      if (
        order.fulfillmentStatus === FulfillmentStatus.PLACED ||
        order.fulfillmentStatus === FulfillmentStatus.CONFIRMED
      ) {
        if (order.paymentStatus === PaymentStatus.PENDING) {
          statistics.pendingOrders += 1;
        }
      }

      // Total delivery cost
      statistics.totalShippingCost += parseFloat(
        (order.deliveryCost || 0).toString(),
      );
    }

    // Calculate average order value
    if (statistics.completedOrders > 0) {
      statistics.averageOrderValue =
        statistics.completedRevenue / statistics.completedOrders;
    }

    return statistics;
  }

  /**
   * Monthly report: total orders (status !== PLACED), revenue (from PAID orders), total to collect (PENDING/PARTIAL).
   */
  async getOrderMonthlyReport(
    monthQuery: MonthQueryDto,
  ): Promise<OrderMonthlyReportResponseDto> {
    const { year, month } = monthQuery;
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const orders = await this.orderModel.findAll({
      where: {
        placedAt: { [Op.gte]: startDate, [Op.lte]: endDate },
        fulfillmentStatus: { [Op.ne]: FulfillmentStatus.PLACED },
      },
      attributes: ['id', 'totalPayable', 'paymentStatus'],
    });

    let revenue = 0;
    let totalToCollect = 0;

    for (const order of orders) {
      const totalPayable = parseFloat(order.totalPayable.toString());
      if (order.paymentStatus === PaymentStatus.PAID) {
        revenue += totalPayable;
      } else if (
        order.paymentStatus === PaymentStatus.PENDING ||
        order.paymentStatus === PaymentStatus.PARTIAL
      ) {
        const paid = await this.paymentReceiptService.getTotalPaidForOrder(
          order.id,
        );
        totalToCollect += totalPayable - paid;
      }
    }

    return {
      year,
      month,
      totalOrders: orders.length,
      revenue,
      totalToCollect,
    };
  }

  /**
   * Daily stats: total orders (status !== PLACED), revenue, total to collect for one day.
   */
  async getOrderDailyStats(dateStr: string): Promise<OrderDailyStatsResponseDto> {
    const startDate = new Date(`${dateStr}T00:00:00.000Z`);
    const endDate = new Date(`${dateStr}T23:59:59.999Z`);

    const orders = await this.orderModel.findAll({
      where: {
        placedAt: { [Op.gte]: startDate, [Op.lte]: endDate },
        fulfillmentStatus: { [Op.ne]: FulfillmentStatus.PLACED },
      },
      attributes: ['id', 'totalPayable', 'paymentStatus'],
    });

    let revenue = 0;
    let totalToCollect = 0;

    for (const order of orders) {
      const totalPayable = parseFloat(order.totalPayable.toString());
      if (order.paymentStatus === PaymentStatus.PAID) {
        revenue += totalPayable;
      } else if (
        order.paymentStatus === PaymentStatus.PENDING ||
        order.paymentStatus === PaymentStatus.PARTIAL
      ) {
        const paid = await this.paymentReceiptService.getTotalPaidForOrder(
          order.id,
        );
        totalToCollect += totalPayable - paid;
      }
    }

    return {
      date: dateStr,
      totalOrders: orders.length,
      revenue,
      totalToCollect,
    };
  }

  /**
   * Yearly report: all 12 monthly reports for the given year (orders ≠ PLACED, revenue, total to collect).
   */
  async getOrderYearlyReport(year: number): Promise<OrderYearlyReportResponseDto> {
    const monthlyReports = [];
    for (let month = 1; month <= 12; month++) {
      const report = await this.getOrderMonthlyReport({ year, month });
      monthlyReports.push(report);
    }
    return { year, monthlyReports };
  }
}


