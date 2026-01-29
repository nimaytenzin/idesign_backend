import { Order } from '../entities/order.entity';
import { PaymentInitiationResponseDTO } from '../../external/payment-settlement/dto/payment-settlement.response';

/**
 * Response for POST /orders/online/checkout.
 * Order is always present (created and committed). Payment initiation may succeed or fail.
 */
export class OrderCheckoutResponseDto {
  /** The created order (always present). */
  order: Order;

  /** Payment initiation result when the gateway call succeeded. Present when payment did not fail. */
  paymentInitiation?: PaymentInitiationResponseDTO;

  /** True when order was created but payment initiation failed (client can retry payment for this order via POST /payment-settlement/initiate-payment with orderId + amount). */
  paymentFailed?: boolean;

  /** Error message when paymentFailed is true. */
  paymentError?: string;
}
