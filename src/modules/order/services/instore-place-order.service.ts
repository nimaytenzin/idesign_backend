import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import type { Transaction } from 'sequelize';
import { Customer } from '../../customer/entities/customer.entity';
import { Order } from '../entities/order.entity';
import {
  FulfillmentStatus,
  PaymentStatus,
  PaymentMethod,
  OrderSource,
  FulfillmentType,
} from '../entities/order.enums';
import { OrderItem } from '../entities/order-item.entity';
import { OrderDiscount } from '../entities/order-discount.entity';
import { Product } from '../../product/entities/product.entity';
import { CustomerService } from '../../customer/customer.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { DiscountCalculationService } from '../../discount/services/discount-calculation.service';
import type { DiscountCalculationResult } from '../../discount/services/discount-calculation.service';
import { DiscountScope } from '../../discount/entities/discount.entity';
import { PaymentReceiptService } from '../../payment-receipt/payment-receipt.service';
import { SmsService } from '../../external/sms/sms.service';
import { OrderPlacementSupportService } from './order-placement-support.service';

// --- Internal types (SRP: clear contracts between steps) ---

/** Counter order notification type: fulfillment + payment status. */
export type CounterOrderNotificationType =
  | 'InstorePaid'
  | 'InstorePending'
  | 'PickupPaid'
  | 'PickupPending'
  | 'DeliveryPaid'
  | 'DeliveryPending';

export interface CounterOrderTotals {
  subtotal: number;
  discount: number;
  deliveryCost: number;
  totalPayable: number;
}

export interface DeliveryInfo {
  deliveryLocation: string | null;
  deliveryMode: string | null;
  deliveryCost: number;
}

export interface OrderItemWithDiscount {
  productId: number;
  quantity: number;
  unitPrice: number;
  discountApplied: number;
  lineTotal: number;
}

interface PersistOrderParams {
  createOrderDto: CreateOrderDto;
  customerId: number;
  totals: CounterOrderTotals;
  deliveryInfo: DeliveryInfo;
  itemsWithDiscounts: OrderItemWithDiscount[];
  discountResult: DiscountCalculationResult;
  transaction: Transaction;
}

@Injectable()
export class InstorePlaceOrderService {
  private readonly logger = new Logger(InstorePlaceOrderService.name);

  constructor(
    @InjectModel(Order)
    private orderModel: typeof Order,
    @InjectModel(OrderItem)
    private orderItemModel: typeof OrderItem,
    @InjectModel(OrderDiscount)
    private orderDiscountModel: typeof OrderDiscount,
    @InjectModel(Product)
    private productModel: typeof Product,
    private readonly sequelize: Sequelize,
    private readonly customerService: CustomerService,
    private readonly discountCalculationService: DiscountCalculationService,
    private readonly orderPlacementSupport: OrderPlacementSupportService,
    private readonly paymentReceiptService: PaymentReceiptService,
    private readonly smsService: SmsService,
  ) {}

  /**
   * Place a counter order with optional immediate payment (Pay Now) or Pay Later.
   * Orchestrator: coordinates validation, calculation, persistence, and notifications.
   */
  async instorePlaceOrder(
    createOrderDto: CreateOrderDto,
    userId?: number,
  ): Promise<Order> {
    this.validateSource(createOrderDto);
    this.validateOrderItems(createOrderDto);

    return this.sequelize.transaction(async (transaction) => {
      const customer = await this.customerService.findOrCreateCustomer(
        createOrderDto.customer,
      );

      const orderItemsForCalculation = await this.validateAndGetProducts(
        createOrderDto.orderItems!,
        transaction,
      );

      const discountResult =
        await this.discountCalculationService.calculateOrderDiscounts(
          orderItemsForCalculation,
          createOrderDto.voucherCode,
        );

      const itemsWithDiscounts = this.applyDiscountsToItems(
        createOrderDto.orderItems!,
        discountResult,
      );

      const deliveryInfo = await this.resolveDeliveryInfo(
        createOrderDto,
        transaction,
      );

      const totals = this.calculateTotals(
        createOrderDto,
        discountResult,
        deliveryInfo.deliveryCost,
      );

      this.logTotals(totals);

      const savedOrder = await this.persistOrderRecords({
        createOrderDto,
        customerId: customer.id,
        totals,
        deliveryInfo,
        itemsWithDiscounts,
        discountResult,
        transaction,
      });

      this.sendOrderNotifications(savedOrder);

      return savedOrder;
    });
  }

  // --- Validation (fail fast, outside or at start of transaction) ---

  private validateSource(dto: CreateOrderDto): void {
    if (dto.orderSource !== OrderSource.COUNTER) {
      throw new BadRequestException(
        'Order source must be COUNTER for instore orders',
      );
    }
  }

  private validateOrderItems(dto: CreateOrderDto): void {
    if (!dto.orderItems || dto.orderItems.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }
  }

  private async validateAndGetProducts(
    items: CreateOrderDto['orderItems'],
    transaction: Transaction,
  ): Promise<Array<{ productId: number; quantity: number; unitPrice: number }>> {
    const result: Array<{
      productId: number;
      quantity: number;
      unitPrice: number;
    }> = [];

    for (const item of items!) {
      const product = await this.productModel.findByPk(item.productId, {
        transaction,
      });
      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.productId} not found`,
        );
      }
      if (!product.isAvailable) {
        throw new BadRequestException(
          `Product ${product.title} is not available`,
        );
      }
      result.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
    }

    return result;
  }

  // --- Calculation domain (no I/O, easy to unit test) ---

  private applyDiscountsToItems(
    items: CreateOrderDto['orderItems'],
    discountResult: DiscountCalculationResult,
  ): OrderItemWithDiscount[] {
    return items!.map((item) => {
      const calculatedDiscount = discountResult.lineItemDiscounts.find(
        (ld) => ld.productId === item.productId,
      );
      const discountApplied =
        calculatedDiscount?.discountAmount ?? item.discountApplied ?? 0;
      const lineTotal = item.quantity * item.unitPrice - discountApplied;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountApplied,
        lineTotal,
      };
    });
  }

  private calculateTotals(
    dto: CreateOrderDto,
    discountResult: DiscountCalculationResult,
    deliveryCost: number,
  ): CounterOrderTotals {
    const subtotal = dto.orderItems!.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const discount =
      discountResult.orderDiscount ?? (dto.discount ?? 0);
    const totalPayable = this.computeTotalPayable(
      subtotal,
      discount,
      deliveryCost,
    );
    return {
      subtotal,
      discount,
      deliveryCost,
      totalPayable,
    };
  }

  /** Single place for order total formula to avoid magic numbers and drift. */
  private computeTotalPayable(
    subtotal: number,
    discount: number,
    deliveryCost: number,
  ): number {
    return subtotal - discount + deliveryCost;
  }

  private logTotals(totals: CounterOrderTotals): void {
    this.logger.log(`[Counter Order Creation] Order totals:`);
    this.logger.log(`  - Subtotal (before discounts): ${totals.subtotal}`);
    this.logger.log(`  - Discount: ${totals.discount}`);
    this.logger.log(`  - Delivery cost: ${totals.deliveryCost}`);
    this.logger.log(`  - Total payable: ${totals.totalPayable}`);
  }

  // --- Delivery (I/O; dynamic import kept to avoid circular dependency) ---

  private async resolveDeliveryInfo(
    dto: CreateOrderDto,
    transaction: Transaction,
  ): Promise<DeliveryInfo> {
    if (dto.fulfillmentType !== FulfillmentType.DELIVERY) {
      return {
        deliveryLocation: null,
        deliveryMode: null,
        deliveryCost: 0,
      };
    }

    if (!dto.deliveryRateId) {
      throw new BadRequestException(
        'deliveryRateId is required when fulfillmentType is DELIVERY',
      );
    }
    if (!dto.shippingAddress) {
      throw new BadRequestException(
        'shippingAddress is required when fulfillmentType is DELIVERY',
      );
    }

    const { DeliveryRate } = await import(
      '../../delivery/delivery-rate/entities/delivery-rate.entity'
    );
    const { DeliveryLocation } = await import(
      '../../delivery/delivery-location/entities/delivery-location.entity'
    );

    const deliveryRate = await DeliveryRate.findByPk(dto.deliveryRateId, {
      include: [{ model: DeliveryLocation, as: 'deliveryLocation' }],
      transaction,
    });

    if (!deliveryRate) {
      throw new NotFoundException(
        `Delivery rate with ID ${dto.deliveryRateId} not found`,
      );
    }

    return {
      deliveryLocation: deliveryRate.deliveryLocation?.name ?? null,
      deliveryMode: deliveryRate.transportMode ?? null,
      deliveryCost: parseFloat(deliveryRate.rate.toString()),
    };
  }

  // --- Persistence (slim transaction: only DB writes) ---

  private async persistOrderRecords(
    params: PersistOrderParams,
  ): Promise<Order> {
    const {
      createOrderDto,
      customerId,
      totals,
      deliveryInfo,
      itemsWithDiscounts,
      discountResult,
      transaction,
    } = params;

    const orderNumber =
      await this.orderPlacementSupport.generateOrderNumberInTransaction(
        transaction,
      );
    const invoiceNumber =
      await this.orderPlacementSupport.generateInvoiceNumber(transaction);

    const now = new Date();
    const fulfillmentStatus =
      createOrderDto.fulfillmentType === FulfillmentType.INSTORE
        ? FulfillmentStatus.CONFIRMED
        : FulfillmentStatus.PROCESSING;

    const order = await this.orderModel.create(
      {
        customerId,
        orderNumber,
        invoiceNumber,
        orderSource: OrderSource.COUNTER,
        fulfillmentType: createOrderDto.fulfillmentType,
        fulfillmentStatus,
        subTotal: totals.subtotal,
        discount: totals.discount,
        totalPayable: totals.totalPayable,
        voucherCode: createOrderDto.voucherCode,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: null,
        deliveryCost: deliveryInfo.deliveryCost,
        deliveryRateId: createOrderDto.deliveryRateId ?? null,
        deliveryLocation: deliveryInfo.deliveryLocation,
        deliveryMode: deliveryInfo.deliveryMode,
        shippingAddress: createOrderDto.shippingAddress ?? null,
        deliveryNotes: createOrderDto.deliveryNotes ?? null,
        expectedDeliveryDate: null,
        internalNotes: createOrderDto.internalNotes,
        referrerSource: createOrderDto.referrerSource ?? null,
        affiliateId: null,
        servedBy: null,
        placedAt: now,
        confirmedAt: now,
        processingAt:
          fulfillmentStatus === FulfillmentStatus.PROCESSING ? now : null,
        shippingAt: null,
        deliveredAt: null,
        paidAt: null,
        receiptGenerated: false,
        receiptNumber: null,
      },
      { transaction },
    );

    await this.persistOrderItems(order.id, itemsWithDiscounts, transaction);
    await this.persistOrderDiscounts(
      order.id,
      discountResult,
      transaction,
    );

    if (createOrderDto.paymentMethod) {
      await this.paymentReceiptService.createPaymentReceipt(
        order.id,
        {
          amount: totals.totalPayable,
          paymentMethod: createOrderDto.paymentMethod,
          paidAt: now,
          bankAccountId:
            createOrderDto.paymentMethod !== PaymentMethod.CASH
              ? createOrderDto.bankAccountId
              : undefined,
        },
        transaction,
      );
    }

    const savedOrder = await this.orderModel.findByPk(order.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: OrderItem, as: 'orderItems' },
        { model: OrderDiscount, as: 'orderDiscounts' },
      ],
      transaction,
    });

    this.logger.log(
      `[Counter Order Created] Order ID: ${savedOrder!.id}, Order Number: ${savedOrder!.orderNumber}, Fulfillment Type: ${savedOrder!.fulfillmentType}, Payment Status: ${savedOrder!.paymentStatus}`,
    );

    return savedOrder!;
  }

  private async persistOrderItems(
    orderId: number,
    items: OrderItemWithDiscount[],
    transaction: Transaction,
  ): Promise<void> {
    for (const item of items) {
      await this.orderItemModel.create(
        {
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountApplied: item.discountApplied,
          lineTotal: item.lineTotal,
        },
        { transaction },
      );
    }
  }

  private async persistOrderDiscounts(
    orderId: number,
    discountResult: DiscountCalculationResult,
    transaction: Transaction,
  ): Promise<void> {
    if (
      !discountResult.appliedDiscounts ||
      discountResult.appliedDiscounts.length === 0
    ) {
      return;
    }

    const orderLevelDiscounts = discountResult.appliedDiscounts.filter(
      (d) => d.discountScope === DiscountScope.ORDER_TOTAL,
    );
    const productLevelDiscounts = discountResult.appliedDiscounts.filter(
      (d) => d.discountScope === DiscountScope.PER_PRODUCT,
    );

    if (
      orderLevelDiscounts.length > 0 &&
      discountResult.orderDiscount > 0
    ) {
      const discountPerDiscount =
        discountResult.orderDiscount / orderLevelDiscounts.length;
      for (const discount of orderLevelDiscounts) {
        await this.orderDiscountModel.create(
          {
            orderId,
            discountId: discount.id,
            discountAmount: discountPerDiscount,
            discountName: discount.name,
            discountType: discount.discountType,
            voucherCode: discount.voucherCode,
          },
          { transaction },
        );
      }
    }

    if (productLevelDiscounts.length > 0) {
      const totalLineItemDiscount = discountResult.lineItemDiscounts.reduce(
        (sum, ld) => sum + ld.discountAmount,
        0,
      );
      if (totalLineItemDiscount > 0) {
        const discountPerDiscount =
          totalLineItemDiscount / productLevelDiscounts.length;
        for (const discount of productLevelDiscounts) {
          await this.orderDiscountModel.create(
            {
              orderId,
              discountId: discount.id,
              discountAmount: discountPerDiscount,
              discountName: discount.name,
              discountType: discount.discountType,
              voucherCode: discount.voucherCode,
            },
            { transaction },
          );
        }
      }
    }
  }

  // --- Notifications (decoupled: fire-and-forget; can be replaced with EventEmitter) ---

  /** Order type for notification: fulfillment + payment status. */
  private getOrderNotificationType(order: Order): CounterOrderNotificationType {
    const ft = order.fulfillmentType;
    const paid = order.paymentStatus === PaymentStatus.PAID;

    if (ft === FulfillmentType.INSTORE) return paid ? 'InstorePaid' : 'InstorePending';
    if (ft === FulfillmentType.PICKUP) return paid ? 'PickupPaid' : 'PickupPending';
    if (ft === FulfillmentType.DELIVERY) return paid ? 'DeliveryPaid' : 'DeliveryPending';

    return 'DeliveryPending';
  }

  private getNotificationMessage(
    order: Order,
    type: CounterOrderNotificationType,
  ): string {
    const customer = (order as any).customer;
    const customerName =
      typeof customer?.name === 'string' && customer.name.trim()
        ? customer.name.trim()
        : 'Customer';
    const total = Number(order.totalPayable ?? 0).toFixed(2);
    const num = order.orderNumber;
    const amount = `Nu.${total}`;

    switch (type) {
      case 'InstorePaid':
        return `Hi ${customerName}! Thank you for your purchase.Please rate our product product link below.`;
      case 'InstorePending':
        return `Hi ${customerName}! Thank you for your purchase. Your order amount ${amount} is pending. Please pay as soon as possible. Thank you!`;
      case 'PickupPaid':
        return `Hi ${customerName}! Thank you! Your order ${num} (${amount}) is paid. We'll have it ready for pickup at our store.`;
      case 'PickupPending':
        return `Hi ${customerName}! Your order ${num} (${amount}) has been placed. Please pay when you collect.`;
      case 'DeliveryPaid':
        return `Hi ${customerName}! Thank you! Your order ${num} (${amount}) has been confirmed. We will deliver to your address.We will send your the driver and vehicle details shortly.`;
      case 'DeliveryPending':
        return `Hi ${customerName}! Thank you for your purchase. Your order amount ${amount} is pending. Please pay as soon as possible. We will send your the driver and vehicle details shortly. Thank you!`;
      default:
        return `Hi ${customerName}! Thank you for your purchase. Your order amount ${amount} is pending. Thank you!`;
    }
  }

  private sendOrderNotifications(order: Order): void {
    const customer = (order as any).customer;
    const phone =
      typeof customer?.phoneNumber === 'string'
        ? customer.phoneNumber.trim()
        : null;

    if (!phone) return;

    const notificationType = this.getOrderNotificationType(order);
    const msg = this.getNotificationMessage(order, notificationType);

    this.smsService
      .sendSmsNotification({ phoneNumber: phone, message: msg })
      .then(() =>
        this.logger.log(
          `[Instore Place Order] SMS sent to ${phone} (${notificationType})`,
        ),
      )
      .catch((e) =>
        this.logger.warn(
          `[Instore Place Order] SMS could not be sent: ${(e as Error)?.message ?? e}`,
        ),
      );
  }
}
