import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
} from '@nestjs/common';
import { PaymentSettlementService } from './payment-settlement.service';
import { CreatePaymentSettlementDto } from './dto/create-payment-settlement.dto';
import { UpdatePaymentSettlementDto } from './dto/update-payment-settlement.dto';
import {
  AERequestDTO,
  ClientInitiatePaymentDTO,
  DRRequestDTO,
} from './dto/payment-settlement.dto';
import { ErrorResponse } from './error-reponse';
import {
  ClientDebitSuccessDTO,
  ClientECMessage,
  PaymentInitiationResponseDTO,
} from './dto/payment-settlement.response';


@Controller('payment-settlement')
export class PaymentSettlementController {
  private readonly logger = new Logger(PaymentSettlementController.name);

  constructor(
    private readonly paymentSettlementService: PaymentSettlementService,
  ) {}

  @Post('initiate-payment')
  sendPaymentInitiation(
    @Body() body: ClientInitiatePaymentDTO,
  ): Promise<PaymentInitiationResponseDTO | ErrorResponse> {
    this.logger.log(`[initiate-payment] Request received`);
    this.logger.log(`[initiate-payment] Request body: ${JSON.stringify(body)}`);
    return this.paymentSettlementService.processInitiatePayment(body);
  }


  @Post('ae-request')
  sendAERequest(
    @Body() body: AERequestDTO,
  ): Promise<ClientECMessage | ErrorResponse> {
    console.log('\n w=debit request received', body);
    return this.paymentSettlementService.processAERequest(body);
  }

  @Post('dr-request')
  sendDRRequest(
    @Body() body: DRRequestDTO,
  ): Promise<ClientDebitSuccessDTO | ErrorResponse> {
    console.log('\n DR request received', body);
    return this.paymentSettlementService.processDRRequest(body);
  }
}
