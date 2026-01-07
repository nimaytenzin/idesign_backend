import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ClientInitiatePaymentDTO {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsNumber()
  @IsNotEmpty()
  orderId: number;
}


export class ZPS_InitiatePaymentDTO {
  @IsNumber()
  @IsNotEmpty()
  transactionRef: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentTitle: string;

  @IsString()
  @IsNotEmpty()
  paymentDescription: string;

  @IsString()
  @IsNotEmpty()
  beneficiaryAccountName: string;

  @IsString()
  @IsNotEmpty()
  beneficiaryAccountNumber: string;

  @IsString()
  @IsNotEmpty()
  beneficiaryBankName: string;

  @IsString()
  @IsNotEmpty()
  beneficiaryBankCode: string;
}

export class ARRequestDTO {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentInstructionNumber: string;
}

export class AERequestDTO {
  @IsString()
  @IsNotEmpty()
  bfsTransactionId: string;

  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;
}

export class DRRequestDTO {
  @IsString()
  @IsNotEmpty()
  bfsTransactionId: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class ZPS_PGTransactionDTO {
  @IsNotEmpty()
  @IsString()
  transactionRef: string;

  @IsNotEmpty()
  @IsString()
  paymentInstructionNumber: string;

  @IsNotEmpty()
  @IsString()
  paymentTitle: string;

  @IsNotEmpty()
  @IsString()
  paymentDescription: string;

  @IsNotEmpty()
  @IsString()
  bfsTxnId: string;

  @IsNotEmpty()
  @IsString()
  bfsBenfTxnTime: string;

  @IsNotEmpty()
  @IsString()
  statusCode: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsEnum(['PAID', 'ERROR', 'TIMEDOUT', 'PROCESSING'])
  status: string;

  @IsNotEmpty()
  @IsNumber()
  userId: number;

  remitterAccount?: string;
  remitterBank?: string;

  @IsNotEmpty()
  @IsString()
  beneficiaryAccountName: string;

  @IsNotEmpty()
  @IsNumber()
  beneficiaryAccountNumber: number;

  @IsNotEmpty()
  @IsString()
  beneficiaryBankName: string;

  @IsNotEmpty()
  @IsString()
  beneficiaryBankCode: string;

  @IsOptional()
  @IsString()
  arResponse?: string;
}
