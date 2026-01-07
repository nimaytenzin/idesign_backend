import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CreatePaymentSettlementDto } from './dto/create-payment-settlement.dto';
import { UpdatePaymentSettlementDto } from './dto/update-payment-settlement.dto';
import { lastValueFrom } from 'rxjs';
import {
  ClientInitiatePaymentDTO,
   ZPS_InitiatePaymentDTO,
  ZPS_PGTransactionDTO,
} from './dto/payment-settlement.dto';
import { PaymentInitiationResponseDTO } from './dto/payment-settlement.response';
import { ErrorResponse } from './error-reponse';
import { OrderService } from '../../order/order.service';
import { SmsService } from '../sms/sms.service';
import { SmsMessageFormatter } from '../sms/sms-message.formatter';
import { SendSmsNotificationDto } from '../sms/dto/create-sm.dto';
import { FulfillmentStatus, PaymentMethod } from '../../order/entities/order.enums';

@Injectable()
export class PaymentSettlementService {
  private readonly logger = new Logger(PaymentSettlementService.name);
  private readonly ZPSS_BASE_URL =
    'https://www.zhidhay.com/zpss/pg-transaction';

  constructor(
    private httpService: HttpService,
    private orderService: OrderService,
    private smsService: SmsService,
    private smsFormatter: SmsMessageFormatter,
  ) {}

  /**
   * Generate payment title with order number and product count (255 char limit)
   */
  private generatePaymentTitle(order: any): string {
    const orderNumber = order.orderNumber || `Order #${order.id}`;
    const productCount = order.orderItems?.length || 0;
    const baseTitle = `${orderNumber} - ${productCount} Item${
      productCount > 1 ? 's' : ''
    }`;

    // Ensure title doesn't exceed 255 characters
    if (baseTitle.length <= 255) {
      return baseTitle;
    }

    // Truncate order number if necessary
    const maxOrderNumberLength =
      255 - ` - ${productCount} Item${productCount > 1 ? 's' : ''}`.length;
    const truncatedOrderNumber =
      orderNumber.substring(0, maxOrderNumberLength - 3) + '...';
    return `${truncatedOrderNumber} - ${productCount} Item${productCount > 1 ? 's' : ''}`;
  }

  /**
   * Generate detailed payment description with product details, customer info, etc.
   */
  private generatePaymentDescription(order: any): string {
    const orderNumber = order.orderNumber || `Order #${order.id}`;
    const orderDate = order.orderDate
      ? new Date(order.orderDate).toLocaleDateString()
      : 'Unknown Date';

    // Get product names
    const productNames =
      order.orderItems?.map((item) => item.product?.title || 'Product').filter(Boolean) ||
      [];
    const productsText =
      productNames.length > 0 ? productNames.join(', ') : 'Unknown Products';

    // Customer info
    const customerName = order.customer?.name || 'Customer';
    const customerPhone = order.customer?.phoneNumber || '';
    const customerEmail = order.customer?.email || '';

    const description = `Order ${orderNumber} on ${orderDate}, Products: ${productsText}, Customer: ${customerName}${
      customerPhone ? ` (${customerPhone})` : ''
    }${customerEmail ? ` [${customerEmail}]` : ''}`;

    return description;
  }

  /**
   * Format time from number to readable format
   */
  private formatTime(timeNumber: number): string {
    const hours = Math.floor(timeNumber);
    const minutes = Math.round((timeNumber - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
  }

  private async postRequest<T>(
    url: string,
    data: any,
    retries = 3,
  ): Promise<T> {
    let attempt = 0;

    while (attempt < retries) {
      try {
        const response = await lastValueFrom(
          this.httpService.post(url, data, {
            headers: { 'Content-Type': 'application/json' },
          }),
        );
        return response.data as T;
      } catch (error) {
        attempt++;
        console.log(error);
        this.logger.warn(error);
        this.logger.warn(
          `Attempt ${attempt} failed for POST request to ${url}: ${error.message}`,
        );

        if (attempt >= retries) {
          this.logger.error(
            `All ${retries} attempts failed for POST request to ${url}`,
            error.stack,
          );

          if (error.code === 'ECONNREFUSED') {
            throw new Error(
              'Failed to connect to the ZPSS service after multiple attempts. Please try again later.',
            );
          }

          if (error.code === 'ETIMEDOUT') {
            throw new Error(
              'The request to the ZPSS service timed out after multiple attempts. Please try again later.',
            );
          }

          throw new Error(
            `An error occurred while processing the request: ${error.message}`,
          );
        }
      }
    }
  }

  async processInitiatePayment(
    data: ClientInitiatePaymentDTO,
  ): Promise<PaymentInitiationResponseDTO | ErrorResponse> {
    let order: any;
    try {
      // Find the order by ID with full details
      order = await this.orderService.findOneOrder(Number(data.orderId));

      console.log('Order details:', order);

      if (!order) {
        throw new Error(`Order with ID ${data.orderId} not found`);
      }

      // Validate order is in PLACED or PROCESSING status (ready for payment)
      if (
        order.fulfillmentStatus !== FulfillmentStatus.PLACED &&
        order.fulfillmentStatus !== FulfillmentStatus.PROCESSING
      ) {
        throw new Error(
          'Order must be in PLACED or PROCESSING status to initiate payment',
        );
      }

      // Get beneficiary account details
      const beneficiaryAccountDetails =
        await this.getBeneficiaryAccountDetails();

      const paymentTitle = this.generatePaymentTitle(order);
      const paymentDescription = this.generatePaymentDescription(order);

      const postData: ZPS_InitiatePaymentDTO = {
        amount: Number(data.amount),
        transactionRef: order.id,
        paymentTitle: paymentTitle,
        paymentDescription: paymentDescription,
        beneficiaryAccountName:
          beneficiaryAccountDetails.beneficiaryAccountName,
        beneficiaryAccountNumber:
          beneficiaryAccountDetails.beneficiaryAccountNumber,
        beneficiaryBankName: beneficiaryAccountDetails.beneficiaryBankName,
        beneficiaryBankCode: beneficiaryAccountDetails.beneficiaryBankCode,
      };

      console.log('Initiating payment with data:', postData);
      const responseData = await this.postRequest<ZPS_PGTransactionDTO>(
        `${this.ZPSS_BASE_URL}/initiate-payment`,
        postData,
      );
      console.log('Payment initiation response:', responseData);

      const rcMessage = JSON.parse(responseData.arResponse);
      console.log('Parsed response message:', rcMessage);

      return {
        paymentInstructionNumber: responseData.paymentInstructionNumber,
        bfsTransactionId: responseData.bfsTxnId,
        amount: data.amount,
        bankList: rcMessage.bfs_bankList,
      };
    } catch (error) {
      this.logger.error('Error during payment initiation', error.stack);

      return new ErrorResponse(
        error.status || 500,
        error.message ||
          'An unexpected error occurred during payment initiation.',
        error.details || null,
      );
    }
  }

  async getBeneficiaryAccountDetails(): Promise<{
    beneficiaryAccountName: string;
    beneficiaryAccountNumber: string;
    beneficiaryBankName: string;
    beneficiaryBankCode: string;
  }> {
    // Theatre account details (should be configurable in production)
    const theatreAccountDetails = {
      accountName: 'Nima Yoezer Tenin',
      accountNumber: '101273372',
      bankName: 'BOB', // Bank of Bhutan
    };

    const bankList = [
      {
        bankCode: '1010',
        bankName: 'BANK OF BHUTAN LIMITED',
        status: 'A',
        shorthand: 'BOB',
      },
      {
        bankCode: '1020',
        bankName: 'Bhutan National Bank Limited',
        status: 'A',
        shorthand: 'BNB',
      },
      {
        bankCode: '1030',
        bankName: 'Druk PNBL',
        status: 'A',
        shorthand: 'PNB',
      },
      {
        bankCode: '1050',
        bankName: 'Bhutan Development Bank Ltd.',
        status: 'A',
        shorthand: 'BDBL',
      },
      {
        bankCode: '1040',
        bankName: 'T Bank Ltd.',
        status: 'A',
        shorthand: 'TBANK',
      },
      {
        bankCode: '1060',
        bankName: 'DK Limited Bank',
        status: 'A',
        shorthand: 'DKBANK',
      },
    ];

    const bank = bankList.find(
      (b) =>
        b.shorthand.toLowerCase() ===
        theatreAccountDetails.bankName.toLowerCase(),
    );

    if (!bank) {
      throw new Error(
        `Bank with name "${theatreAccountDetails.bankName}" not found in the bank list.`,
      );
    }

    return {
      beneficiaryAccountName: theatreAccountDetails.accountName,
      beneficiaryAccountNumber: theatreAccountDetails.accountNumber,
      beneficiaryBankName: theatreAccountDetails.bankName,
      beneficiaryBankCode: bank.bankCode,
    };
  }

  async processAERequest(
    data: any, // AE Request data
  ): Promise<any | ErrorResponse> {
    try {
      if (!data.bfsTransactionId || !data.bankCode || !data.accountNumber) {
        throw new ErrorResponse(
          400,
          'Invalid input: transactionId, bankCode, and accountNumber are required.',
        );
      }

      const response = await this.postRequest<any>(
        `${this.ZPSS_BASE_URL}/ae-request`,
        data,
      );

      // Basic response validation (adjust based on actual response structure)
      if (response.bfs_responseCode && response.bfs_responseCode !== '00') {
        throw new ErrorResponse(
          400,
          `Payment gateway error: ${response.bfs_responseCode}`,
          {
            responseCode: response.bfs_responseCode,
          },
        );
      }

      return {
        status: 'OK',
      };
    } catch (error) {
      this.logger.error('Error during AE request', error.stack);

      if (error instanceof ErrorResponse) {
        return error;
      }

      if (error.code === 'ECONNREFUSED') {
        return new ErrorResponse(
          503,
          'Failed to connect to the ZPSS service. Please try again later.',
        );
      }

      if (error.code === 'ETIMEDOUT') {
        return new ErrorResponse(
          504,
          'The request to the ZPSS service timed out. Please try again later.',
        );
      }

      return new ErrorResponse(
        500,
        'An unexpected error occurred during the AE request.',
        error.message,
      );
    }
  }

  async processDRRequest(
    data: any, // DR Request data containing bfsTransactionId and otp
  ): Promise<any | ErrorResponse> {
    this.logger.log('=== Processing DR Request ===');
    this.logger.log('DR Request data:', JSON.stringify(data, null, 2));

    if (!data.bfsTransactionId || !data.otp) {
      this.logger.error('Invalid DR request: missing required fields');
      return new ErrorResponse(
        400,
        'Invalid input: transactionId and otp are required.',
      );
    }

    let order: any | null = null;

    try {
      const zpsDRResponse = await this.postRequest<ZPS_PGTransactionDTO>(
        `${this.ZPSS_BASE_URL}/dr-request`,
        data,
      );

      console.log('DR Response:', zpsDRResponse);

      // Find the order using the transaction reference
      order = await this.orderService.findOneOrder(
        Number(zpsDRResponse.transactionRef),
      );

      if (!order) {
        return new ErrorResponse(404, 'Order not found.');
      }

      if (zpsDRResponse.statusCode === '00') {
        // Transaction successful - process payment (skip SMS)
        await this.orderService.processPayment(order.id, {
          paymentMethod: PaymentMethod.ZPSS,
          paymentDate: new Date().toISOString(),
          internalNotes: `Payment completed via ZPSS. BFS Transaction ID: ${data.bfsTransactionId}. Payment Instruction Number: ${zpsDRResponse.paymentInstructionNumber}`,
        }, true); // Skip SMS

        // Get updated order details
        const updatedOrder = await this.orderService.findOneOrder(order.id);

        // Update fulfillment status based on current status (skip SMS)
        if (updatedOrder.fulfillmentStatus === FulfillmentStatus.PLACED) {
          await this.orderService.updateFulfillmentStatus(order.id, {
            fulfillmentStatus: FulfillmentStatus.CONFIRMED,
            internalNotes: 'Order confirmed after successful ZPSS payment',
          }, true); // Skip SMS
        } else if (updatedOrder.fulfillmentStatus === FulfillmentStatus.CONFIRMED) {
          await this.orderService.updateFulfillmentStatus(order.id, {
            fulfillmentStatus: FulfillmentStatus.PROCESSING,
            internalNotes: 'Order processing started after successful ZPSS payment',
          }, true); // Skip SMS
        }

        // Reload order to get updated status
        const finalOrder = await this.orderService.findOneOrder(order.id);

        // Send ONLY ONE SMS notification
        try {
          const orderNumber = finalOrder.orderNumber || `Order #${finalOrder.id}`;
          const smsMessage = `Thank you for your payment. Payment details received. We will process your order ${orderNumber} as soon as possible.`;

          // Validate the message before sending
          const validation = this.smsFormatter.validateMessage(smsMessage);
          if (!validation.isValid) {
            this.logger.warn(`SMS validation failed: ${validation.error}`);
          } else {
            const customerPhone = finalOrder.customer?.phoneNumber;
            if (customerPhone) {
              const smsData: SendSmsNotificationDto = {
                phoneNumber: customerPhone,
                message: smsMessage,
                senderName: 'iDesign',
              };

              this.logger.log(
                `Sending payment confirmation SMS to ${customerPhone}`,
              );
              const smsResult = await this.smsService.sendSmsNotification(smsData);

              if (smsResult.success) {
                this.logger.log(
                  `SMS notification sent successfully for order ID: ${order.id}`,
                );
              } else {
                this.logger.warn(
                  `SMS notification failed for order ID: ${order.id}: ${smsResult.message}`,
                );
              }
            }
          }
        } catch (smsError) {
          // Don't fail the payment process if SMS fails - just log the error
          this.logger.error(
            `Failed to send SMS notification for order ID: ${order.id}:`,
            smsError.message,
          );
        }

        this.logger.log(`Payment successful for order ID: ${order.id}`);

        // Return success response
        return {
          statusCode: zpsDRResponse.statusCode,
          order: finalOrder,
        };
      } else {
        // Transaction failed - update order status to CANCELLED
        await this.orderService.cancelOrder(
          order.id,
          `Payment failed: ${zpsDRResponse.arResponse || zpsDRResponse.statusCode}`,
        );

        this.logger.warn(
          `Payment failed for order ID: ${order.id}, Status: ${zpsDRResponse.statusCode}`,
        );

        return new ErrorResponse(400, 'Payment processing failed', {
          statusCode: zpsDRResponse.statusCode,
          statusMessage: zpsDRResponse.arResponse,
        });
      }
    } catch (error) {
      this.logger.error('Error processing DR request', error.stack);

      // Update order to CANCELLED if we have it
      if (order) {
        try {
          await this.orderService.cancelOrder(
            order.id,
            `DR request error: ${error.message}`,
          );
        } catch (updateError) {
          this.logger.error('Failed to update order status', updateError);
        }
      }

      if (error instanceof ErrorResponse) {
        return error;
      }

      if (error.code === 'ECONNREFUSED') {
        return new ErrorResponse(
          503,
          'Failed to connect to the ZPSS service. Please try again later.',
        );
      }

      if (error.code === 'ETIMEDOUT') {
        return new ErrorResponse(
          504,
          'The request to the ZPSS service timed out. Please try again later.',
        );
      }

      return new ErrorResponse(
        500,
        'An unexpected error occurred during the DR request.',
        error.message,
      );
    }
  }

   

  /**
   * Complete payment and confirm order
   */
  async completeOrderPayment(
    orderId: number,
    paymentData: any,
  ): Promise<any | ErrorResponse> {
    try {
      // Process the DR request (payment completion)
      const result = await this.processDRRequest(paymentData);

      if (result instanceof ErrorResponse) {
        return result;
      }

      // If payment successful, the order status is already updated to COMPLETED
      this.logger.log(
        `Order payment completed successfully for order: ${orderId}`,
      );

      return {
        success: true,
        message: 'Payment completed successfully',
        order: result.order,
      };
    } catch (error) {
      this.logger.error('Error completing order payment', error.stack);
      return new ErrorResponse(
        500,
        'Failed to complete payment for order',
        error.message,
      );
    }
  }

}
