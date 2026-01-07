import { PGBank } from '../models/bfs';
import { Order } from 'src/modules/order/entities/order.entity';

export interface PaymentInitiationResponseDTO {
  paymentInstructionNumber: string;
  bfsTransactionId: string;
  amount: number;
  bankList: PGBank[];
}

export interface ClientECMessage {
  status: string;
}

export interface ClientDebitSuccessDTO {
  statusCode: string;
  order: Order;
}
