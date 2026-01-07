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
import { GetCustomerStatusDto } from './dto/get-customer-status.dto';
import { Order } from './entities/order.entity';
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
    // SMS notification is handled in the service
    return this.orderService.createOrder(createOrderDto);
  }

  @Get()
  async findAllOrders(@Query() query: OrderQueryDto): Promise<Order[]> {
    return this.orderService.findAllOrders(query);
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

  @Post(':id/deliver')
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

