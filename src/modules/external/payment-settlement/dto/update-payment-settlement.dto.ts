import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentSettlementDto } from './create-payment-settlement.dto';

export class UpdatePaymentSettlementDto extends PartialType(CreatePaymentSettlementDto) {}
