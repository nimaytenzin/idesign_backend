import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { PaymentReceiptService } from './payment-receipt.service';
import { CreatePaymentReceiptDto } from './dto/create-payment-receipt.dto';
import { RecordOrderPaymentDto } from './dto/record-order-payment.dto';
import { PaymentReceipt } from './entities/payment-receipt.entity';

@Controller('payment-receipts')
export class PaymentReceiptController {
  constructor(private readonly paymentReceiptService: PaymentReceiptService) {}

  /**
   * Create a payment receipt (full or partial) for an order. Body includes orderId.
   * POST /payment-receipts
   */
  @Post()
  create(@Body() dto: CreatePaymentReceiptDto): Promise<PaymentReceipt> {
    const orderId = dto.orderId;
    if (!orderId || orderId <= 0) {
      throw new BadRequestException('Valid orderId is required');
    }
    const recordDto: RecordOrderPaymentDto = {
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      bankAccountId: dto.bankAccountId,
      paidAt: dto.paidAt,
      notes: dto.notes,
    };
    return this.paymentReceiptService.recordOrderPayment(orderId, recordDto);
  }

  /**
   * List payment receipts for an order.
   * GET /payment-receipts/order/:orderId
   */
  @Get('order/:orderId')
  listByOrder(@Param('orderId', ParseIntPipe) orderId: number): Promise<PaymentReceipt[]> {
    return this.paymentReceiptService.getPaymentReceiptsForOrder(orderId);
  }

  /**
   * Get a single payment receipt by id.
   * GET /payment-receipts/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PaymentReceipt> {
    return this.paymentReceiptService.findOne(id);
  }
}
