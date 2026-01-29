import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Customer } from '../../customer/entities/customer.entity';
import { Order } from '../entities/order.entity';
import {
  FulfillmentStatus,
  PaymentStatus,
  OrderSource,
  FulfillmentType,
} from '../entities/order.enums';
import { OrderItem } from '../entities/order-item.entity';
import { OrderDiscount } from '../entities/order-discount.entity';
import { Product } from '../../product/entities/product.entity';
import { CustomerService } from '../../customer/customer.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { DiscountCalculationService } from '../../discount/services/discount-calculation.service';
import { DiscountScope } from '../../discount/entities/discount.entity';
import { AffiliateCommission } from '../../affiliate-marketer-management/affiliate-commission/entities/affiliate-commission.entity';
import { SmsTriggerService } from '../../sms-template/services/sms-trigger.service';
import { SmsTriggerEvent } from '../../sms-template/entities/sms-template.entity';
import { OrderPlacementSupportService } from './order-placement-support.service';

@Injectable()
export class OnlinePlaceOrderService {
  private readonly logger = new Logger(OnlinePlaceOrderService.name);

  constructor(
    @InjectModel(Order)
    private orderModel: typeof Order,
    @InjectModel(OrderItem)
    private orderItemModel: typeof OrderItem,
    @InjectModel(OrderDiscount)
    private orderDiscountModel: typeof OrderDiscount,
    @InjectModel(Product)
    private productModel: typeof Product,
    @InjectModel(AffiliateCommission)
    private affiliateCommissionModel: typeof AffiliateCommission,
    private readonly sequelize: Sequelize,
    private readonly customerService: CustomerService,
    private readonly discountCalculationService: DiscountCalculationService,
    private readonly orderPlacementSupport: OrderPlacementSupportService,
    private readonly smsTriggerService: SmsTriggerService,
  ) {}

  /**
   * Place an online order (order source ONLINE or COUNTER when used for pay-later).
   * Payment status starts as PENDING.
   */
  async onlinePlaceOrder(
    createOrderDto: CreateOrderDto,
    userId?: number,
  ): Promise<Order> {
    return this.sequelize.transaction(async (transaction) => {
      const customer = await this.customerService.findOrCreateCustomer(
        createOrderDto.customer,
      );

      if (
        !createOrderDto.orderItems ||
        createOrderDto.orderItems.length === 0
      ) {
        throw new BadRequestException('Order must have at least one item');
      }

      const orderItemsForCalculation = [];
      for (const item of createOrderDto.orderItems) {
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

        orderItemsForCalculation.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        });
      }

      const discountResult =
        await this.discountCalculationService.calculateOrderDiscounts(
          orderItemsForCalculation,
          createOrderDto.voucherCode,
        );

      this.logger.log(`[Order Creation] Discount calculation result:`);
      this.logger.log(`  - Order discount: ${discountResult.orderDiscount}`);
      this.logger.log(
        `  - Line item discounts: ${discountResult.lineItemDiscounts.length} items`,
      );
      this.logger.log(
        `  - Applied discounts: ${discountResult.appliedDiscounts.length}`,
      );

      const itemsWithDiscounts = createOrderDto.orderItems.map((item) => {
        const calculatedDiscount = discountResult.lineItemDiscounts.find(
          (ld) => ld.productId === item.productId,
        );
        const discountApplied =
          calculatedDiscount?.discountAmount || item.discountApplied || 0;
        const lineTotal = item.quantity * item.unitPrice - discountApplied;
        return {
          ...item,
          discountApplied,
          lineTotal,
        };
      });

      const subtotal = itemsWithDiscounts.reduce(
        (sum, item) => sum + item.lineTotal,
        0,
      );

      const fulfillmentType =
        createOrderDto.fulfillmentType || FulfillmentType.DELIVERY;
      if (fulfillmentType === FulfillmentType.DELIVERY) {
        if (!createOrderDto.deliveryRateId) {
          throw new BadRequestException(
            'deliveryRateId is required when fulfillmentType is DELIVERY',
          );
        }
        if (!createOrderDto.shippingAddress) {
          throw new BadRequestException(
            'shippingAddress is required when fulfillmentType is DELIVERY',
          );
        }
      }

      let deliveryLocation: string | null = null;
      let deliveryMode: string | null = null;
      let deliveryCost = createOrderDto.deliveryCost || 0;

      if (createOrderDto.deliveryRateId) {
        const { DeliveryRate } = await import(
          '../../delivery/delivery-rate/entities/delivery-rate.entity'
        );
        const { DeliveryLocation } = await import(
          '../../delivery/delivery-location/entities/delivery-location.entity'
        );

        const deliveryRate = await DeliveryRate.findByPk(
          createOrderDto.deliveryRateId,
          {
            include: [{ model: DeliveryLocation, as: 'deliveryLocation' }],
            transaction,
          },
        );

        if (deliveryRate) {
          deliveryLocation = deliveryRate.deliveryLocation?.name || null;
          deliveryMode = deliveryRate.transportMode || null;
          if (createOrderDto.deliveryCost === undefined) {
            deliveryCost = parseFloat(deliveryRate.rate.toString());
          }
        }
      }

      const orderTotalBeforeDiscount =
        createOrderDto.orderItems.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0,
        ) + deliveryCost;

      const discount =
        discountResult.orderDiscount || createOrderDto.discount || 0;
      const totalPayable = subtotal - discount + deliveryCost;

      this.logger.log(`[Order Creation] Order totals:`);
      this.logger.log(
        `  - Subtotal (after line item discounts): ${subtotal}`,
      );
      this.logger.log(`  - Discount: ${discount}`);
      this.logger.log(`  - Delivery cost: ${deliveryCost}`);
      this.logger.log(`  - Total payable: ${totalPayable}`);

      const orderNumber =
        await this.orderPlacementSupport.generateOrderNumberInTransaction(
          transaction,
        );
      const invoiceNumber =
        await this.orderPlacementSupport.generateInvoiceNumber(transaction);

      const orderSource = createOrderDto.orderSource || OrderSource.ONLINE;
      const paymentStatus = PaymentStatus.PENDING;

      let affiliateId: number | null = null;
      let commissionPercentage: number | null = null;

      if (createOrderDto.voucherCode) {
        const affiliateLink =
          await this.orderPlacementSupport.linkAffiliateMarketerByVoucherCode(
            createOrderDto.voucherCode,
            transaction,
          );

        if (affiliateLink) {
          affiliateId = affiliateLink.affiliateId;
          commissionPercentage = affiliateLink.commissionPercentage;
        }
      }

      const now = new Date();
      const order = await this.orderModel.create(
        {
          customerId: customer.id,
          orderNumber,
          invoiceNumber,
          orderSource: createOrderDto.orderSource || OrderSource.ONLINE,
          fulfillmentType,
          subTotal: subtotal,
          discount,
          totalPayable,
          voucherCode: createOrderDto.voucherCode,
          fulfillmentStatus: FulfillmentStatus.PLACED,
          paymentStatus,
          paymentMethod: createOrderDto.paymentMethod || null,
          deliveryCost,
          deliveryRateId: createOrderDto.deliveryRateId || null,
          deliveryLocation,
          deliveryMode,
          shippingAddress: createOrderDto.shippingAddress || null,
          internalNotes: createOrderDto.internalNotes,
          referrerSource: createOrderDto.referrerSource || null,
          affiliateId,
          servedBy:
            createOrderDto.servedBy ||
            (orderSource === OrderSource.COUNTER && userId
              ? userId
              : null),
          placedAt: now,
          paidAt: null,
        },
        { transaction },
      );

      for (const item of itemsWithDiscounts) {
        await this.orderItemModel.create(
          {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountApplied: item.discountApplied,
            lineTotal: item.lineTotal,
          },
          { transaction },
        );
      }

      if (
        discountResult.appliedDiscounts &&
        discountResult.appliedDiscounts.length > 0
      ) {
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
                orderId: order.id,
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
          const totalLineItemDiscount =
            discountResult.lineItemDiscounts.reduce(
              (sum, ld) => sum + ld.discountAmount,
              0,
            );

          if (totalLineItemDiscount > 0) {
            const discountPerDiscount =
              totalLineItemDiscount / productLevelDiscounts.length;

            for (const discount of productLevelDiscounts) {
              await this.orderDiscountModel.create(
                {
                  orderId: order.id,
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

      if (
        affiliateId &&
        commissionPercentage !== null &&
        commissionPercentage > 0
      ) {
        const commissionAmount =
          (orderTotalBeforeDiscount * commissionPercentage) / 100;

        await this.affiliateCommissionModel.create(
          {
            affiliateId,
            orderId: order.id,
            orderTotal: orderTotalBeforeDiscount,
            commissionAmount,
            commissionPercentage,
            orderDate: now,
            paymentStatus,
          },
          { transaction },
        );

        this.logger.log(
          `[Affiliate Commission] Created commission for affiliate ${affiliateId}: ${commissionAmount} (${commissionPercentage}% of ${orderTotalBeforeDiscount})`,
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
        `[Order Created] Order ID: ${savedOrder.id}, Order Number: ${savedOrder.orderNumber}, Source: ${orderSource}, Payment Status: ${paymentStatus}`,
      );

      // Online orders: do not send SMS on placed; SMS is sent when payment is successful (e.g. on DR request).
      // Counter pay-later only: send ORDER_PLACED SMS.
      if (orderSource === OrderSource.COUNTER) {
        const triggerEvent = SmsTriggerEvent.ORDER_PLACED;
        this.smsTriggerService
          .processSmsTemplates(savedOrder, triggerEvent)
          .then(() =>
            this.logger.log(
              `[SMS Trigger] Queued SMS templates for order ${savedOrder.id}`,
            ),
          )
          .catch((e) =>
            this.logger.error(
              `[SMS Trigger] order ${savedOrder.id}: ${(e as Error)?.message}`,
              (e as Error)?.stack,
            ),
          );
      }

      return savedOrder;
    });
  }
}
