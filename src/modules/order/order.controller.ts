import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  HttpStatus,
  BadRequestException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { MonthQueryDto } from './dto/month-query.dto';
import { OrdersByMonthResponseDto } from './dto/orders-by-month-response.dto';
import { OrderStatisticsByMonthResponseDto } from './dto/order-statistics-by-month-response.dto';
import { TrackOrderDto } from './dto/track-order.dto';
import { UpdateFulfillmentStatusDto } from './dto/update-fulfillment-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { VerifyOrderDto } from './dto/verify-order.dto';
import { MarkDeliveredDto } from './dto/mark-delivered.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { ShipOrderDto } from './dto/ship-order.dto';
import { GetCustomerStatusDto } from './dto/get-customer-status.dto';
import { Order } from './entities/order.entity';
import { GetOrdersPaginatedQueryDto } from './dto/get-orders-paginated-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { PaginatedResponseDto } from '../../common/pagination/dto/paginated-response.dto';
// SMS sending is handled via templates and outbox processor - no direct SMS sending

@Controller('orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(
    private readonly orderService: OrderService,
    // SMS sending is handled via templates and outbox processor - no direct SMS sending
  ) {}

  /**
   * Validate and parse order ID from string parameter
   * @param id - String ID parameter from route
   * @returns Parsed numeric order ID
   * @throws BadRequestException if ID is invalid
   */
  private validateOrderId(id: string): number {
    const orderId = parseInt(id, 10);
    if (isNaN(orderId) || orderId <= 0) {
      throw new BadRequestException(`Invalid order ID: ${id}. Order ID must be a positive number.`);
    }
    return orderId;
  }

  // Order Endpoints
  @Post()
  async createOrder(
    @Request() req,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    // Extract referrer from request if not provided in DTO
    if (!createOrderDto.referrerSource) {
      const referrer = req.headers['referer'] || req.headers['referrer'];
      if (referrer) {
        createOrderDto.referrerSource = referrer as string;
      }
    }
    
    // Set servedBy from authenticated user for counter orders
    if (createOrderDto.orderSource === 'COUNTER' && req.user?.id) {
      createOrderDto.servedBy = req.user.id;
    }
    
    // SMS notification is handled in the service
    return this.orderService.createOrder(createOrderDto, req.user?.id);
  }


  //Admin/Staff Place Order Endpoint

  // Payment status is paid and payment details is sent in the payload,
  // for instore purchase, where fulfillment type is instore, payment method is cash or bank transfer,
  // delivery rate id is not required, delivery location is not required, delivery mode is not required,
  // shipping address is not required, expected delivery date is not required,
  // internal notes is the internal notes, referrer source is the referrer source,
    // affiliate id is not required, served by is not required,
  // placed at,confirmed at,processing at,shipping at,delivered at  and paid at are date now,
  @Post('instore/place-order')
  async adminPlaceOrder(
    @Request() req,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    console.log(createOrderDto);
    console.log(req.user?.id);
    return this.orderService.instorePlaceOrder(createOrderDto, req.user?.id);
  }

  @Get()
  async findAllOrders(@Query() query: OrderQueryDto): Promise<Order[]> {
    return this.orderService.findAllOrders(query);
  }

  /**
   * Get orders paginated by fulfillment status
   * 
   * @description Retrieves a paginated list of orders, optionally filtered by fulfillment status.
   * This endpoint is restricted to ADMIN and STAFF roles only. Orders are returned with full
   * details including customer information, order items with products, and applied discounts.
   * Results are ordered by placement date (most recent first).
   * 
   * @route GET /orders/paginated
   * @access Private (Admin, Staff)
   * 
   * @query {number} [page=1] - Page number (minimum: 1)
   * @query {number} [limit=10] - Number of items per page (minimum: 1, maximum: 100)
   * @query {FulfillmentStatus} [fulfillmentStatus] - Optional filter by fulfillment status
   *   - PLACED: Order has been placed but not yet confirmed
   *   - CONFIRMED: Order has been confirmed and is ready for processing
   *   - PROCESSING: Order is being prepared/processed
   *   - SHIPPING: Order is out for delivery
   *   - DELIVERED: Order has been successfully delivered
   *   - CANCELED: Order has been canceled
   * 
   * @returns {PaginatedResponseDto<Order>} Paginated response containing:
   *   - data: Array of Order objects with customer, orderItems, and orderDiscounts
   *   - meta: Pagination metadata (total, page, limit, totalPages, hasNextPage, hasPreviousPage)
   * 
   * @example
   * // Get first page of all orders (default: 10 items per page)
   * GET /orders/paginated
   * 
   * @example
   * // Get second page with 20 items per page
   * GET /orders/paginated?page=2&limit=20
   * 
   * @example
   * // Get all orders with PROCESSING status
   * GET /orders/paginated?fulfillmentStatus=PROCESSING
   * 
   * @example
   * // Get first page of DELIVERED orders with 15 items per page
   * GET /orders/paginated?page=1&limit=15&fulfillmentStatus=DELIVERED
   * 
   * @example Response:
   * {
   *   "data": [
   *     {
   *       "id": 1,
   *       "orderNumber": "ORD-2024-0001",
   *       "customer": { ... },
   *       "orderItems": [ ... ],
   *       "orderDiscounts": [ ... ],
   *       "fulfillmentStatus": "PROCESSING",
   *       "paymentStatus": "PAID",
   *       ...
   *     }
   *   ],
   *   "meta": {
   *     "total": 50,
   *     "page": 1,
   *     "limit": 10,
   *     "totalPages": 5,
   *     "hasNextPage": true,
   *     "hasPreviousPage": false
   *   }
   * }
   * 
   * @throws {401} Unauthorized - If user is not authenticated
   * @throws {403} Forbidden - If user is not ADMIN or STAFF
   * @throws {400} BadRequest - If query parameters are invalid (e.g., page < 1, limit > 100)
   */
  @Get('paginated')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getOrdersPaginated(@Query() queryDto: GetOrdersPaginatedQueryDto): Promise<PaginatedResponseDto<Order>> {
    return this.orderService.getOrdersPaginated(queryDto);
  }

  // Order Tracking Endpoint - MUST come before :id route
  @Get('track')
  async trackOrder(@Query() trackOrderDto: TrackOrderDto): Promise<Order | Order[]> {
    return this.orderService.trackOrder(trackOrderDto);
  }

  // Monthly Reports Endpoints - MUST come before :id route
  @Get('by-month')
  async getOrdersByMonth(
    @Query('year') year: string,
    @Query('month') month: string,
  ): Promise<OrdersByMonthResponseDto> {
    // Parse and validate query parameters
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);
    
    if (isNaN(yearNum) || isNaN(monthNum)) {
      throw new BadRequestException('Year and month must be valid numbers');
    }
    
    if (yearNum < 1900 || yearNum > 2100) {
      throw new BadRequestException('Year must be between 1900 and 2100');
    }
    
    if (monthNum < 1 || monthNum > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }
    
    return this.orderService.getOrdersByMonth({ year: yearNum, month: monthNum });
  }

  @Get('statistics/by-month')
  async getOrderStatisticsByMonth(
    @Query('year') year: string,
    @Query('month') month: string,
  ): Promise<OrderStatisticsByMonthResponseDto> {
    // Parse and validate query parameters
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);
    
    if (isNaN(yearNum) || isNaN(monthNum)) {
      throw new BadRequestException('Year and month must be valid numbers');
    }
    
    if (yearNum < 1900 || yearNum > 2100) {
      throw new BadRequestException('Year must be between 1900 and 2100');
    }
    
    if (monthNum < 1 || monthNum > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }
    
    return this.orderService.getOrderStatisticsByMonth({ year: yearNum, month: monthNum });
  }

  @Get(':id')
  async findOneOrder(@Param('id') id: string): Promise<Order & { customerStatusMessage?: string }> {
    const orderId = this.validateOrderId(id);
    const order = await this.orderService.findOneOrder(orderId);
    const customerStatus = this.orderService.getCustomerStatusMessage(order);
    return {
      ...order.toJSON(),
      customerStatusMessage: customerStatus.customerStatusMessage,
    } as any;
  }

  @Get(':id/customer-status')
  async getCustomerStatus(@Param('id') id: string): Promise<GetCustomerStatusDto> {
    const orderId = this.validateOrderId(id);
    const order = await this.orderService.findOneOrder(orderId);
    return this.orderService.getCustomerStatusMessage(order);
  }

  @Patch(':id')
  async updateOrder(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<Order> {
    const orderId = this.validateOrderId(id);
    return this.orderService.updateOrder(orderId, updateOrderDto);
  }

  @Patch(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const orderId = this.validateOrderId(id);
    return this.orderService.updateOrderStatus(orderId, updateOrderStatusDto);
  }

  @Patch(':id/fulfillment-status')
  async updateFulfillmentStatus(
    @Param('id') id: string,
    @Body() updateFulfillmentStatusDto: UpdateFulfillmentStatusDto,
  ): Promise<Order> {
    const orderId = this.validateOrderId(id);
    return this.orderService.updateFulfillmentStatus(orderId, updateFulfillmentStatusDto);
  }

  @Patch(':id/payment-status')
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() updatePaymentStatusDto: UpdatePaymentStatusDto,
  ): Promise<Order> {
    const orderId = this.validateOrderId(id);
    return this.orderService.updatePaymentStatus(orderId, updatePaymentStatusDto);
  }

  /**
   * Confirm an order
   * 
   * @description Confirms an order by updating payment status to PAID and converting fulfillment
   * status from PLACED to CONFIRMED. This endpoint is restricted to ADMIN and STAFF roles only.
   * The order must be in PLACED status with PENDING payment to be confirmed.
   * 
   * This operation:
   * - Updates payment status to PAID
   * - Updates payment method (required)
   * - Optionally updates transaction ID and internal notes
   * - Converts fulfillment status from PLACED to CONFIRMED
   * - Sets confirmedAt timestamp
   * - Sets paidAt timestamp
   * - Generates receipt number if not already generated
   * - Creates accounting entries
   * - Triggers SMS notifications (if configured)
   * 
   * @route POST /orders/:id/confirm
   * @access Private (Admin, Staff)
   * 
   * @param {string} id - Order ID (path parameter)
   * @param {ConfirmOrderDto} confirmOrderDto - Payment confirmation details
   * @param {PaymentMethod} confirmOrderDto.paymentMethod - Payment method used (required)
   *   - CASH: Cash payment
   *   - MBOB: Mobile banking payment
   *   - BDB_EPAY: Bank payment
   *   - TPAY: TPay payment
   *   - BNB_MPAY: BNB mobile payment
   *   - ZPSS: ZPSS payment
   * @param {string} [confirmOrderDto.transactionId] - Optional transaction/reference ID
   * @param {string} [confirmOrderDto.internalNotes] - Optional internal notes about the confirmation
   * 
   * @returns {Order} Updated Order object with:
   *   - paymentStatus: "PAID"
   *   - fulfillmentStatus: "CONFIRMED"
   *   - paymentMethod: Updated payment method
   *   - paidAt: Payment timestamp
   *   - confirmedAt: Confirmation timestamp
   *   - receiptNumber: Generated receipt number (if not already present)
   *   - Full order details including customer, items, and discounts
   * 
   * @example
   * // Confirm order with cash payment
   * POST /orders/123/confirm
   * {
   *   "paymentMethod": "CASH",
   *   "internalNotes": "Payment received at counter"
   * }
   * 
   * @example
   * // Confirm order with bank transfer
   * POST /orders/123/confirm
   * {
   *   "paymentMethod": "BDB_EPAY",
   *   "transactionId": "TXN-2024-001234",
   *   "internalNotes": "Bank transfer confirmed via online banking"
   * }
   * 
   * @example Response:
   * {
   *   "id": 123,
   *   "orderNumber": "ORD-2024-0001",
   *   "paymentStatus": "PAID",
   *   "fulfillmentStatus": "CONFIRMED",
   *   "paymentMethod": "CASH",
   *   "paidAt": "2024-01-15T10:30:00Z",
   *   "confirmedAt": "2024-01-15T10:30:00Z",
   *   "receiptNumber": "RCP-2024-0001",
   *   "customer": { ... },
   *   "orderItems": [ ... ],
   *   ...
   * }
   * 
   * @throws {401} Unauthorized - If user is not authenticated
   * @throws {403} Forbidden - If user is not ADMIN or STAFF
   * @throws {404} NotFound - If order with given ID does not exist
   * @throws {400} BadRequest - If order is not in PLACED status
   * @throws {400} BadRequest - If payment status is not PENDING
   * @throws {400} BadRequest - If payment method is invalid
   */
  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async confirmOrder(
    @Param('id') id: string,
    @Body() confirmOrderDto: ConfirmOrderDto,
  ): Promise<Order> {
    const orderId = this.validateOrderId(id);
    return this.orderService.confirmOrder(orderId, confirmOrderDto);
  }

  /**
   * Ship an order
   * 
   * @description Ships an order by updating fulfillment status to SHIPPING and setting delivery
   * driver information. This endpoint is restricted to ADMIN and STAFF roles only.
   * The order must be in CONFIRMED or PROCESSING status with PAID payment to be shipped.
   * 
   * This operation:
   * - Updates fulfillment status to SHIPPING
   * - Sets driver name (required)
   * - Sets driver phone (optional)
   * - Sets vehicle/car number (required)
   * - Sets expected delivery date (required, must be in the future)
   * - Sets shippingAt timestamp
   * - Optionally updates internal notes
   * - Triggers SMS notifications (if configured)
   * 
   * @route POST /orders/:id/ship
   * @access Private (Admin, Staff)
   * 
   * @param {string} id - Order ID (path parameter)
   * @param {ShipOrderDto} shipOrderDto - Delivery driver details
   * @param {string} shipOrderDto.driverName - Name of the delivery driver (required)
   * @param {string} [shipOrderDto.driverPhone] - Phone number of the delivery driver (optional)
   * @param {string} shipOrderDto.vehicleNumber - Vehicle/car number/plate (required)
   * @param {string} shipOrderDto.expectedDeliveryDate - Expected delivery date in ISO format (required, must be future date)
   * @param {string} [shipOrderDto.internalNotes] - Optional internal notes about the shipment
   * 
   * @returns {Order} Updated Order object with:
   *   - fulfillmentStatus: "SHIPPING"
   *   - driverName: Driver name
   *   - driverPhone: Driver phone (if provided)
   *   - vehicleNumber: Vehicle number
   *   - expectedDeliveryDate: Expected delivery date
   *   - shippingAt: Shipping timestamp
   *   - Full order details including customer, items, and discounts
   * 
   * @example
   * // Ship order with driver details
   * POST /orders/123/ship
   * {
   *   "driverName": "John Doe",
   *   "driverPhone": "+975-17123456",
   *   "vehicleNumber": "BT-1234",
   *   "expectedDeliveryDate": "2024-01-20T14:00:00Z",
   *   "internalNotes": "Fragile items - handle with care"
   * }
   * 
   * @example
   * // Ship order with minimal details
   * POST /orders/123/ship
   * {
   *   "driverName": "Jane Smith",
   *   "vehicleNumber": "BT-5678",
   *   "expectedDeliveryDate": "2024-01-20T16:00:00Z"
   * }
   * 
   * @example Response:
   * {
   *   "id": 123,
   *   "orderNumber": "ORD-2024-0001",
   *   "fulfillmentStatus": "SHIPPING",
   *   "driverName": "John Doe",
   *   "driverPhone": "+975-17123456",
   *   "vehicleNumber": "BT-1234",
   *   "expectedDeliveryDate": "2024-01-20T14:00:00Z",
   *   "shippingAt": "2024-01-15T10:30:00Z",
   *   "customer": { ... },
   *   "orderItems": [ ... ],
   *   ...
   * }
   * 
   * @throws {401} Unauthorized - If user is not authenticated
   * @throws {403} Forbidden - If user is not ADMIN or STAFF
   * @throws {404} NotFound - If order with given ID does not exist
   * @throws {400} BadRequest - If order is not in CONFIRMED or PROCESSING status
   * @throws {400} BadRequest - If payment status is not PAID
   * @throws {400} BadRequest - If expected delivery date is not in the future
   * @throws {400} BadRequest - If required fields are missing
   */
  @Post(':id/ship')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async shipOrder(
    @Param('id') id: string,
    @Body() shipOrderDto: ShipOrderDto,
  ): Promise<Order> {
    const orderId = this.validateOrderId(id);
    return this.orderService.shipOrder(orderId, shipOrderDto);
  }

  @Post(':id/verify')
  async verifyOrder(
    @Param('id') id: string,
    @Body() verifyOrderDto: VerifyOrderDto,
  ): Promise<Order> {
    const orderId = this.validateOrderId(id);
    return this.orderService.verifyOrder(orderId, verifyOrderDto);
  }

  @Post(':id/payment')
  async processPayment(
    @Param('id') id: string,
    @Body() processPaymentDto: ProcessPaymentDto,
  ): Promise<Order> {
    const orderId = this.validateOrderId(id);
    return this.orderService.processPayment(orderId, processPaymentDto);
  }

  @Post(':id/cancel')
  async cancelOrder(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ): Promise<Order> {
    const orderId = this.validateOrderId(id);
    return this.orderService.cancelOrder(orderId, body.reason);
  }

  /**
   * Mark order as delivered
   * 
   * @description Marks an order as delivered by updating fulfillment status to DELIVERED.
   * This endpoint is restricted to ADMIN and STAFF roles only.
   * The order must be in SHIPPING status to be marked as delivered.
   * 
   * This operation:
   * - Updates fulfillment status to DELIVERED
   * - Sets deliveredAt timestamp
   * - Generates a feedback token for customer feedback
   * - Optionally updates internal notes
   * - Increments product sales count
   * - Triggers SMS notifications with feedback link (if configured)
   * 
   * @route POST /orders/:id/deliver
   * @access Private (Admin, Staff)
   * 
   * @param {string} id - Order ID (path parameter)
   * @param {MarkDeliveredDto} [markDeliveredDto] - Optional delivery details
   * @param {string} [markDeliveredDto.internalNotes] - Optional internal notes about the delivery
   * 
   * @returns {Order} Updated Order object with:
   *   - fulfillmentStatus: "DELIVERED"
   *   - deliveredAt: Delivery timestamp
   *   - feedbackToken: Generated feedback token for customer feedback
   *   - Full order details including customer, items, and discounts
   * 
   * @example
   * // Mark order as delivered
   * POST /orders/123/deliver
   * 
   * @example
   * // Mark order as delivered with notes
   * POST /orders/123/deliver
   * {
   *   "internalNotes": "Delivered successfully. Customer satisfied."
   * }
   * 
   * @example Response:
   * {
   *   "id": 123,
   *   "orderNumber": "ORD-2024-0001",
   *   "fulfillmentStatus": "DELIVERED",
   *   "deliveredAt": "2024-01-20T14:30:00Z",
   *   "feedbackToken": "550e8400-e29b-41d4-a716-446655440000",
   *   "customer": { ... },
   *   "orderItems": [ ... ],
   *   ...
   * }
   * 
   * @throws {401} Unauthorized - If user is not authenticated
   * @throws {403} Forbidden - If user is not ADMIN or STAFF
   * @throws {404} NotFound - If order with given ID does not exist
   * @throws {400} BadRequest - If order is not in SHIPPING status
   */
  @Post(':id/deliver')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async markOrderAsDelivered(
    @Param('id') id: string,
    @Body() markDeliveredDto?: MarkDeliveredDto,
  ): Promise<Order> {
    const orderId = this.validateOrderId(id);
    return this.orderService.markOrderAsDelivered(orderId, markDeliveredDto);
  }

  @Delete(':id')
  async removeOrder(@Param('id') id: string): Promise<void> {
    const orderId = this.validateOrderId(id);
    return this.orderService.removeOrder(orderId);
  }
}

