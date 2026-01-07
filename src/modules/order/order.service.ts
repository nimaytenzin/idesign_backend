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
import { FulfillmentStatus, PaymentStatus, PaymentMethod, OrderType } from './entities/order.enums';
import { OrderItem } from './entities/order-item.entity';
import { OrderDiscount } from './entities/order-discount.entity';
import { Product } from '../product/entities/product.entity';
import { AccountsService } from '../accounts/accounts.service';
import { CustomerService } from '../customer/customer.service';
import { Transaction } from '../accounts/transaction/entities/transaction.entity';
import { ChartOfAccounts } from '../accounts/chart-of-accounts/entities/chart-of-accounts.entity';
import { CustomerDetailsDto } from '../customer/dto/customer-details.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateFulfillmentStatusDto } from './dto/update-fulfillment-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { VerifyOrderDto } from './dto/verify-order.dto';
import { GetCustomerStatusDto } from './dto/get-customer-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { MonthQueryDto } from './dto/month-query.dto';
import { OrdersByMonthResponseDto } from './dto/orders-by-month-response.dto';
import { OrderStatisticsByMonthResponseDto } from './dto/order-statistics-by-month-response.dto';
import { TrackOrderDto } from './dto/track-order.dto';
import { MarkDeliveredDto } from './dto/mark-delivered.dto';
import { SmsTriggerService } from '../sms-template/services/sms-trigger.service';
import { SmsTriggerEvent } from '../sms-template/entities/sms-template.entity';
import { DiscountCalculationService } from '../discount/services/discount-calculation.service';
import { DiscountScope } from '../discount/entities/discount.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { AffiliateCommission } from '../affiliate/entities/affiliate-commission.entity';
import { v4 as uuidv4 } from 'uuid';

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
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(AffiliateCommission)
    private affiliateCommissionModel: typeof AffiliateCommission,
    private readonly sequelize: Sequelize,
    private readonly customerService: CustomerService,
    private readonly accountsService: AccountsService,
    private readonly smsTriggerService: SmsTriggerService,
    private readonly discountCalculationService: DiscountCalculationService,
  ) {}

  // Find or create customer based on email, name, or phone
  // Uses CustomerService to handle customer operations
  private async findOrCreateCustomer(
    customerDetails: CustomerDetailsDto,
  ): Promise<Customer> {
    return this.customerService.findOrCreateCustomer(customerDetails);
  }

  // Order Number Generation
  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;

    // Find the last order number for this year
    const lastOrder = await this.orderModel.findOne({
      where: {
        orderNumber: {
          [Op.like]: `${prefix}%`,
        },
      },
      order: [['orderNumber', 'DESC']],
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(
        lastOrder.orderNumber.replace(prefix, ''),
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  private async generateOrderNumberInTransaction(transaction?: any): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;

    const lastOrder = await this.orderModel.findOne({
      where: {
        orderNumber: {
          [Op.like]: `${prefix}%`,
        },
      },
      order: [['orderNumber', 'DESC']],
      transaction,
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(
        lastOrder.orderNumber.replace(prefix, ''),
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Link affiliate marketer to order by voucher code
   * @param voucherCode - The voucher code to check
   * @param transaction - Optional transaction context
   * @returns Object with affiliateId and commissionPercentage, or null if not found
   */
  private async linkAffiliateMarketerByVoucherCode(
    voucherCode: string,
    transaction?: any,
  ): Promise<{ affiliateId: number; commissionPercentage: number } | null> {
    if (!voucherCode) {
      return null;
    }

    const affiliate = await this.userModel.findOne({
      where: {
        voucherCode: voucherCode.trim().toUpperCase(),
        role: UserRole.AFFILIATE_MARKETER,
        isActive: true, // Only link to active affiliate marketers
      },
      transaction,
    });

    if (!affiliate) {
      this.logger.debug(
        `[Affiliate Linking] No active affiliate marketer found for voucher code: ${voucherCode}`,
      );
      return null;
    }

    const commissionPercentage = affiliate.commissionPercentage
      ? parseFloat(affiliate.commissionPercentage.toString())
      : 0;

    this.logger.log(
      `[Affiliate Linking] Linked affiliate marketer ${affiliate.id} (${affiliate.name}) to order via voucher code: ${voucherCode}`,
    );

    return {
      affiliateId: affiliate.id,
      commissionPercentage,
    };
  }

  // Receipt Number Generation
  private async generateReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RCP-${year}-`;

    // Find the last receipt number for this year
    const lastOrder = await this.orderModel.findOne({
      where: {
        receiptNumber: {
          [Op.like]: `${prefix}%`,
        },
      },
      order: [['receiptNumber', 'DESC']],
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(
        lastOrder.receiptNumber.replace(prefix, ''),
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  // Order Methods - Direct implementation (CQRS removed, keeping event sourcing)
  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    // Use transaction for atomicity
    return this.sequelize.transaction(async (transaction) => {

      // Find or create customer
      const customer = await this.customerService.findOrCreateCustomer(
        createOrderDto.customer,
      );

      // Validate order has at least one item
      if (
        !createOrderDto.orderItems ||
        createOrderDto.orderItems.length === 0
      ) {
        throw new BadRequestException('Order must have at least one item');
      }

      // Validate products exist
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

      // Calculate discounts using discount calculation service
      const discountResult =
        await this.discountCalculationService.calculateOrderDiscounts(
          orderItemsForCalculation,
          createOrderDto.voucherCode,
        );

      this.logger.log(
        `[Order Creation] Discount calculation result:`,
      );
      this.logger.log(
        `  - Order discount: ${discountResult.orderDiscount}`,
      );
      this.logger.log(
        `  - Line item discounts: ${discountResult.lineItemDiscounts.length} items`,
      );
      this.logger.log(
        `  - Applied discounts: ${discountResult.appliedDiscounts.length}`,
      );

      // Apply calculated discounts to items (merge with any manually provided discounts)
      const itemsWithDiscounts = createOrderDto.orderItems.map((item) => {
        const calculatedDiscount = discountResult.lineItemDiscounts.find(
          (ld) => ld.productId === item.productId,
        );
        // Use calculated discount if available, otherwise use provided discount
        const discountApplied =
          calculatedDiscount?.discountAmount || item.discountApplied || 0;

        const lineTotal = item.quantity * item.unitPrice - discountApplied;
        return {
          ...item,
          discountApplied,
          lineTotal,
        };
      });

      // Calculate subtotal after item discounts
      const subtotal = itemsWithDiscounts.reduce(
        (sum, item) => sum + item.lineTotal,
        0,
      );

      // Calculate order total BEFORE any discounts (for affiliate commission calculation)
      // This is the sum of all item prices (quantity * unitPrice) + shipping cost
      const shippingCost = createOrderDto.shippingCost || 0;
      const orderTotalBeforeDiscount = createOrderDto.orderItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      ) + shippingCost;

      // Use calculated order discount (merge with any manually provided)
      const orderDiscount =
        discountResult.orderDiscount || createOrderDto.orderDiscount || 0;

      const totalAmount = subtotal - orderDiscount + shippingCost;

      this.logger.log(
        `[Order Creation] Order totals:`,
      );
      this.logger.log(
        `  - Subtotal (after line item discounts): ${subtotal}`,
      );
      this.logger.log(
        `  - Order discount: ${orderDiscount}`,
      );
      this.logger.log(
        `  - Shipping cost: ${shippingCost}`,
      );
      this.logger.log(
        `  - Total amount: ${totalAmount}`,
      );

      // Generate order number
      const orderNumber = await this.generateOrderNumberInTransaction(transaction);

      // Determine order type and payment status
      const orderType = createOrderDto.orderType || OrderType.ONLINE;
      const paymentStatus =
        orderType === OrderType.COUNTER && createOrderDto.paymentMethod
          ? PaymentStatus.PAID
          : PaymentStatus.PENDING;

      // Link affiliate marketer by voucher code if provided
      let affiliateId: number | null = null;
      let commissionPercentage: number | null = null;

      if (createOrderDto.voucherCode) {
        const affiliateLink = await this.linkAffiliateMarketerByVoucherCode(
          createOrderDto.voucherCode,
          transaction,
        );

        if (affiliateLink) {
          affiliateId = affiliateLink.affiliateId;
          commissionPercentage = affiliateLink.commissionPercentage;
        }
      }

      // Create order projection
      const now = new Date();
      const order = await this.orderModel.create(
        {
          customerId: customer.id,
          orderNumber,
          orderDate: now,
          orderType,
          totalAmount,
          orderDiscount,
          voucherCode: createOrderDto.voucherCode,
          fulfillmentStatus: FulfillmentStatus.PLACED,
          paymentStatus,
          paymentMethod: createOrderDto.paymentMethod || null,
          shippingCost,
          internalNotes: createOrderDto.internalNotes,
          referrerSource: createOrderDto.referrerSource || null,
          affiliateId,
          placedAt: now,
          paidAt: paymentStatus === PaymentStatus.PAID ? now : null,
          lastUpdated: now,
        },
        { transaction },
      );

      // Create order items with calculated discounts
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

      // Track applied discounts - create OrderDiscount records
      if (discountResult.appliedDiscounts && discountResult.appliedDiscounts.length > 0) {
        // Group discounts by scope
        const orderLevelDiscounts = discountResult.appliedDiscounts.filter(
          (d) => d.discountScope === DiscountScope.ORDER_TOTAL
        );
        const productLevelDiscounts = discountResult.appliedDiscounts.filter(
          (d) => d.discountScope === DiscountScope.PER_PRODUCT
        );

        // Track order-level discounts
        if (orderLevelDiscounts.length > 0 && discountResult.orderDiscount > 0) {
          // Split order discount among applicable order-level discounts
          const discountPerDiscount = discountResult.orderDiscount / orderLevelDiscounts.length;
          
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

        // Track product-level discounts
        if (productLevelDiscounts.length > 0) {
          // Calculate total line item discount
          const totalLineItemDiscount = discountResult.lineItemDiscounts.reduce(
            (sum, ld) => sum + ld.discountAmount,
            0
          );

          if (totalLineItemDiscount > 0) {
            // Split line item discounts among applicable product-level discounts
            const discountPerDiscount = totalLineItemDiscount / productLevelDiscounts.length;
            
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

      // Create affiliate commission record if voucher code belongs to an affiliate
      if (affiliateId && commissionPercentage !== null && commissionPercentage > 0) {
        const commissionAmount = (orderTotalBeforeDiscount * commissionPercentage) / 100;

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

      // Reload order with relations
      const savedOrder = await this.orderModel.findByPk(order.id, {
        include: [
          { model: Customer, as: 'customer' },
          { model: OrderItem, as: 'orderItems' },
          { model: OrderDiscount, as: 'orderDiscounts' },
        ],
        transaction,
      });

      // Trigger SMS templates (after transaction commits - async, won't block)
      const triggerEvent =
        orderType === OrderType.COUNTER
          ? SmsTriggerEvent.COUNTER_PAYMENT_RECEIPT
          : SmsTriggerEvent.ORDER_PLACED;

      this.logger.log(
        `[Order Created] Order ID: ${savedOrder.id}, Order Number: ${savedOrder.orderNumber}, Type: ${orderType}, Payment Status: ${paymentStatus}, Trigger Event: ${triggerEvent}`,
      );
      this.logger.log(
        `[SMS Trigger] Starting SMS template processing for order ${savedOrder.id} with trigger: ${triggerEvent}, orderType: ${orderType}`,
      );

      // Process SMS templates asynchronously (fire and forget)
      this.smsTriggerService
        .processSmsTemplates(savedOrder, triggerEvent)
        .then(() => {
          this.logger.log(
            `[SMS Trigger] Successfully queued SMS templates for order ${savedOrder.id}`,
          );
        })
        .catch((error) => {
          this.logger.error(
            `[SMS Trigger] Failed to process SMS templates for order ${savedOrder.id}: ${error.message || error}`,
            error.stack,
          );
        });

      return savedOrder;
    });
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
      where.orderDate = {};
      if (query.startDate) {
        where.orderDate[Op.gte] = new Date(query.startDate);
      }
      if (query.endDate) {
        where.orderDate[Op.lte] = new Date(query.endDate);
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
      order: [['orderDate', 'DESC']],
    });
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
          { model: Transaction, include: [ChartOfAccounts] },
        ],
        order: [['orderDate', 'DESC']],
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
          { model: Transaction, include: [ChartOfAccounts] },
        ],
        order: [['orderDate', 'DESC']],
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
    if (updateOrderDto.orderItems || updateOrderDto.shippingCost !== undefined) {
      let totalAmount = updateOrderDto.shippingCost ?? order.shippingCost;

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
          totalAmount += lineTotal;

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
        totalAmount = items.reduce(
          (sum, item) => sum + parseFloat(item.lineTotal.toString()),
          updateOrderDto.shippingCost ?? order.shippingCost,
        );
      }

      await order.update({ totalAmount });
    }

    if (updateOrderDto.internalNotes !== undefined) {
      await order.update({ internalNotes: updateOrderDto.internalNotes });
    }

    // Handle voucher code update and affiliate linking
    if (updateOrderDto.voucherCode !== undefined) {
      const updateData: any = {
        voucherCode: updateOrderDto.voucherCode || null,
      };

      // Link affiliate marketer if voucher code is provided
      if (updateOrderDto.voucherCode) {
        const affiliateLink = await this.linkAffiliateMarketerByVoucherCode(
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
              parseFloat(order.shippingCost?.toString() || '0'),
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
              orderDate: order.orderDate,
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
              parseFloat(order.shippingCost?.toString() || '0'),
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
      this.validateStatusTransition(order.fulfillmentStatus, updateOrderStatusDto.fulfillmentStatus);
      updateData.fulfillmentStatus = updateOrderStatusDto.fulfillmentStatus;
      statusChanged = true;

      // Handle side effects
      if (updateOrderStatusDto.fulfillmentStatus === FulfillmentStatus.DELIVERED) {
        // Increment product sales count when order is delivered
        await this.incrementProductSalesCount(id);
      }
    }

    if (updateOrderStatusDto.paymentStatus) {
      updateData.paymentStatus = updateOrderStatusDto.paymentStatus;
      if (updateOrderStatusDto.paymentStatus === PaymentStatus.PAID && !order.paidAt) {
        updateData.paidAt = new Date();
        updateData.paymentDate = new Date();
      }
      statusChanged = true;
    }

    if (updateOrderStatusDto.internalNotes) {
      updateData.internalNotes = updateOrderStatusDto.internalNotes
        ? `${order.internalNotes || ''}\n${updateOrderStatusDto.internalNotes}`.trim()
        : order.internalNotes;
    }

    await order.update(updateData);
    const updatedOrder = await this.findOneOrder(id);

    // Create accounting entries when payment status moves to PAID
    if (
      updateOrderStatusDto.paymentStatus === PaymentStatus.PAID &&
      order.paymentStatus !== PaymentStatus.PAID
    ) {
      // Ensure receipt is generated before creating transactions
      if (!updatedOrder.receiptGenerated) {
        const receiptNumber = await this.generateReceiptNumber();
        await updatedOrder.update({
          receiptGenerated: true,
          receiptNumber,
          paymentDate: updatedOrder.paidAt || new Date(),
        });
        // Reload to get updated receipt number
        const reloadedOrder = await this.findOneOrder(id);
        await this.accountsService.createAccountingEntriesForOrder(reloadedOrder);
      } else {
        await this.accountsService.createAccountingEntriesForOrder(updatedOrder);
      }
    }

    // SMS notifications are handled via templates in CQRS handlers
    // No direct SMS sending - all SMS goes through template system and outbox processor

    return updatedOrder;
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

    if (paymentDate < order.orderDate) {
      throw new BadRequestException('Payment date cannot be before order date');
    }

    // Use updatePaymentStatus to trigger SMS templates
    this.logger.log(
      `[Process Payment] Executing updatePaymentStatus to set status to PAID`,
    );
    const updatedOrder = await this.updatePaymentStatus(id, {
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: processPaymentDto.paymentMethod,
    });

    this.logger.log(
      `[Process Payment] Payment status updated successfully`,
    );

    // Update additional fields that aren't in the command
    if (processPaymentDto.paymentDate || processPaymentDto.internalNotes) {
      const updateData: any = {};
      if (processPaymentDto.paymentDate) {
        updateData.paymentDate = paymentDate;
      }
      if (processPaymentDto.internalNotes) {
        updateData.internalNotes = processPaymentDto.internalNotes
          ? `${updatedOrder.internalNotes || ''}\nPayment Note: ${processPaymentDto.internalNotes}`.trim()
          : updatedOrder.internalNotes;
      }
      if (Object.keys(updateData).length > 0) {
        await this.orderModel.update(updateData, { where: { id } });
      }
    }

    // Generate receipt if not already generated
    const reloadedOrder = await this.findOneOrder(id);
    if (!reloadedOrder.receiptGenerated) {
      const receiptNumber = await this.generateReceiptNumber();
      await reloadedOrder.update({
        receiptGenerated: true,
        receiptNumber,
        paymentDate: reloadedOrder.paymentDate || paymentDate,
      });
    }

    // Create double-entry accounting transactions
    const finalOrder = await this.findOneOrder(id);
    await this.accountsService.createAccountingEntriesForOrder(finalOrder);

    return finalOrder;
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

    return this.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const newStatus = updateFulfillmentStatusDto.fulfillmentStatus;
      
      // Prepare update data with status and timestamp
      const updateData: any = {
        fulfillmentStatus: newStatus,
        lastUpdated: now,
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
      await order.update(
        {
          fulfillmentStatus: FulfillmentStatus.DELIVERED,
          deliveredAt: now,
          feedbackToken,
          lastUpdated: now,
        },
        { transaction },
      );

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

      // Determine if fulfillment status should change to CONFIRMED
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

      // Update order with new statuses and timestamps
      this.logger.log(`[Update Payment Status] Updating order with new statuses...`);
      await order.update(
        {
          paymentStatus: updatePaymentStatusDto.paymentStatus,
          fulfillmentStatus: newFulfillmentStatus,
          paymentMethod: updatePaymentStatusDto.paymentMethod || order.paymentMethod,
          paidAt: updatePaymentStatusDto.paymentStatus === PaymentStatus.PAID ? now : order.paidAt,
          confirmedAt: confirmedAt,
          lastUpdated: now,
        },
        { transaction },
      );

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

      if (trigger) {
        this.logger.log(`[Update Payment Status] Triggering SMS templates with event: ${trigger}`);
        this.logger.log(`[Update Payment Status]   Payment Status: ${previousPaymentStatus} → ${updatePaymentStatusDto.paymentStatus}`);
        this.logger.log(`[Update Payment Status]   Fulfillment Status: ${oldFulfillmentStatus} → ${updatedFulfillmentStatus}`);
        
        this.smsTriggerService
          .processSmsTemplates(savedOrder, trigger)
          .then(() => {
            this.logger.log(`[Update Payment Status] ✅ Successfully queued SMS templates for order ${savedOrder.id}`);
          })
          .catch((error) => {
            this.logger.error(`[Update Payment Status] ❌ Failed to process SMS templates for order ${savedOrder.id}: ${error.message || error}`, error.stack);
          });
      } else {
        this.logger.log(`[Update Payment Status] ⚠️  No SMS trigger event for status changes:`);
        this.logger.log(`[Update Payment Status]   Payment: ${previousPaymentStatus} → ${updatePaymentStatusDto.paymentStatus}`);
        this.logger.log(`[Update Payment Status]   Fulfillment: ${oldFulfillmentStatus} → ${updatedFulfillmentStatus}`);
      }

      this.logger.log(`[Update Payment Status] ========================================`);

      // Handle accounting side effects (create accounting entries) - after transaction
      if (
        oldStatus !== PaymentStatus.PAID &&
        updatePaymentStatusDto.paymentStatus === PaymentStatus.PAID
      ) {
        // Ensure receipt is generated before creating transactions
        if (!savedOrder.receiptGenerated) {
          const receiptNumber = await this.generateReceiptNumber();
          await savedOrder.update({
            receiptGenerated: true,
            receiptNumber,
            paymentDate: savedOrder.paidAt || new Date(),
          });
          const reloadedOrder = await this.findOneOrder(id);
          await this.accountsService.createAccountingEntriesForOrder(reloadedOrder);
        } else {
          await this.accountsService.createAccountingEntriesForOrder(savedOrder);
        }
      }

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

    const updateData: any = {
      paymentMethod: updatePaymentMethodDto.paymentMethod,
    };

    // If ZPSS is selected, auto-verify and set to PAID
    if (updatePaymentMethodDto.paymentMethod === PaymentMethod.ZPSS) {
      updateData.paymentStatus = PaymentStatus.PAID;
      updateData.verifiedAt = new Date();
      updateData.paidAt = new Date();
      updateData.paymentDate = new Date();

      // Generate receipt
      if (!order.receiptGenerated) {
        const receiptNumber = await this.generateReceiptNumber();
        updateData.receiptGenerated = true;
        updateData.receiptNumber = receiptNumber;
      }
    }

    if (updatePaymentMethodDto.internalNotes) {
      updateData.internalNotes = updatePaymentMethodDto.internalNotes
        ? `${order.internalNotes || ''}\nPayment Method Updated: ${updatePaymentMethodDto.internalNotes}`.trim()
        : order.internalNotes;
    }

    await order.update(updateData);
    const updatedOrder = await this.findOneOrder(id);

    // If ZPSS, update payment status to PAID (triggers SMS templates)
    if (updatePaymentMethodDto.paymentMethod === PaymentMethod.ZPSS) {
      this.logger.log(
        `[Update Payment Method] ZPSS payment method selected - auto-setting payment to PAID`,
      );
      // Use updatePaymentStatus to trigger SMS templates
      const paidOrder = await this.updatePaymentStatus(id, {
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.ZPSS,
      });
      return paidOrder;
    }

    return updatedOrder;
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

    // Generate receipt if not already generated
    const reloadedOrder = await this.findOneOrder(id);
    if (!reloadedOrder.receiptGenerated) {
      const receiptNumber = await this.generateReceiptNumber();
      await reloadedOrder.update({
        receiptGenerated: true,
        receiptNumber,
      });
    }

    // Create accounting entries
    const finalOrder = await this.findOneOrder(id);
    await this.accountsService.createAccountingEntriesForOrder(finalOrder);

    return finalOrder;
  }

  // Workflow Logic Methods
  private validateStatusTransition(
    currentStatus: FulfillmentStatus,
    newStatus: FulfillmentStatus,
  ): void {
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

    if (
      order.fulfillmentStatus === FulfillmentStatus.DELIVERED
    ) {
      // If order is delivered, create reversal entries
      await this.accountsService.createReversalEntriesForOrder(order, reason);
    }

    const now = new Date();
    await order.update({
      fulfillmentStatus: FulfillmentStatus.CANCELED,
      paymentStatus: PaymentStatus.FAILED,
      canceledAt: now,
      lastUpdated: now,
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
        orderDate: {
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
      order: [['orderDate', 'DESC']],
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
        orderDate: {
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
        statistics.totalRevenue += parseFloat(order.totalAmount.toString());
      }

      // Count completed orders (delivered)
      if (order.fulfillmentStatus === FulfillmentStatus.DELIVERED) {
        statistics.completedOrders += 1;
        if (order.paymentStatus === PaymentStatus.PAID) {
          statistics.completedRevenue += parseFloat(order.totalAmount.toString());
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

      // Total shipping cost
      statistics.totalShippingCost += parseFloat(
        (order.shippingCost || 0).toString(),
      );
    }

    // Calculate average order value
    if (statistics.completedOrders > 0) {
      statistics.averageOrderValue =
        statistics.completedRevenue / statistics.completedOrders;
    }

    return statistics;
  }
}


