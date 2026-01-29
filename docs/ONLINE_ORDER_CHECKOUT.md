# Online Order – Single Entry Point (Checkout)

Documentation for the online order flow: one request to create the order and initiate payment.

**Route:** `POST /orders/online/checkout`  
**Authentication:** Optional (JWT if available; `req.user?.id` used when present).

---

## Overview

- **Single entry point:** Use **only** `POST /orders/online/checkout` for online orders. Do not call a separate “place order” or “initiate payment” endpoint for the initial flow.
- **Flow:** Backend creates the order (committed to DB), then initiates payment with the gateway. Response is either success (order + payment initiation) or order created but payment failed (order + `paymentFailed` + `paymentError`).
- **Retry:** If the response has `paymentFailed: true`, the client can retry payment for that order via `POST /payment-settlement/initiate-payment` with `{ orderId: order.id, amount: order.totalPayable }`.

---

## Request: Payload DTO

**Body:** `CreateOrderDto` (JSON).  
`orderSource` is forced to `ONLINE` by the backend; other fields are as below.

### CreateOrderDto

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customer` | `CustomerDetailsDto` | Yes | Customer details (see below). |
| `orderItems` | `CreateOrderItemDto[]` | Yes | At least one item. |
| `orderSource` | enum | No | Ignored; set to `ONLINE` by server. |
| `fulfillmentType` | enum | No | `DELIVERY` \| `PICKUP` \| `INSTORE`. Default typically `DELIVERY`. |
| `paymentMethod` | enum | No | e.g. `CASH`, `MBOB`, `BDB_EPAY`, etc. |
| `bankAccountId` | number | No | Optional when payment method is not CASH (RMA PG bank used if omitted). |
| `discount` | number | No | Order-level discount amount (≥ 0). |
| `voucherCode` | string | No | Voucher / affiliate code. |
| `deliveryCost` | number | No | Override delivery cost (≥ 0). |
| `deliveryRateId` | number | Yes if DELIVERY | Required when `fulfillmentType === DELIVERY`. |
| `shippingAddress` | string | Yes if DELIVERY | Required when `fulfillmentType === DELIVERY`. |
| `deliveryNotes` | string | No | Delivery instructions. |
| `internalNotes` | string | No | Internal only. |
| `referrerSource` | string | No | Set from `Referer` header if not sent. |
| `transactionId` | string | No | Optional external reference. |
| `servedBy` | number | No | User ID if applicable. |

### CustomerDetailsDto (nested in `customer`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Customer name. |
| `email` | string | No | Email (valid format if provided). |
| `phoneNumber` | string | No | Phone. |
| `shippingAddress` | string | No | Shipping address. |
| `billingAddress` | string | No | Billing address. |

### CreateOrderItemDto (each element of `orderItems`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `productId` | number | Yes | Product ID. |
| `quantity` | number | Yes | ≥ 1. |
| `unitPrice` | number | Yes | ≥ 0. |
| `discountApplied` | number | No | Line discount (≥ 0). |

### Example request body

```json
{
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "17123456",
    "shippingAddress": "Thimphu, Bhutan"
  },
  "orderItems": [
    { "productId": 1, "quantity": 2, "unitPrice": 500 }
  ],
  "fulfillmentType": "DELIVERY",
  "deliveryRateId": 1,
  "shippingAddress": "Thimphu, Bhutan",
  "paymentMethod": "BDB_EPAY"
}
```

---

## Response: Success and Fail DTO

**Response type:** `OrderCheckoutResponseDto`.  
Same DTO is used for both success and failure; presence of `paymentInitiation` vs `paymentFailed`/`paymentError` indicates the outcome.

### OrderCheckoutResponseDto

| Field | Type | When present | Description |
|-------|------|--------------|-------------|
| `order` | `Order` | Always | Created order (id, orderNumber, totalPayable, fulfillmentStatus, paymentStatus, customer, orderItems, etc.). |
| `paymentInitiation` | `PaymentInitiationResponseDTO` | Success | Payment gateway response (instruction number, bank list, amount). |
| `paymentFailed` | boolean | Failure | `true` when order was created but payment initiation failed. |
| `paymentError` | string | Failure | Error message when `paymentFailed` is true. |

### PaymentInitiationResponseDTO (success only)

| Field | Type | Description |
|-------|------|-------------|
| `paymentInstructionNumber` | string | Gateway payment instruction number. |
| `bfsTransactionId` | string | Gateway transaction ID. |
| `amount` | number | Amount initiated. |
| `bankList` | array | List of banks / options for the customer to pay. |

---

## Success response (payment initiated)

When the order is created and payment initiation succeeds, the response includes `order` and `paymentInitiation`. **Do not** send `paymentFailed` or `paymentError`.

**Example (success):**

```json
{
  "order": {
    "id": 42,
    "orderNumber": "ORD-2025-00042",
    "totalPayable": 1500.00,
    "fulfillmentStatus": "PLACED",
    "paymentStatus": "PENDING",
    "customer": { "id": 1, "name": "John Doe", "phoneNumber": "17123456", "email": "john@example.com" },
    "orderItems": [...],
    "placedAt": "2025-01-15T10:00:00.000Z"
  },
  "paymentInitiation": {
    "paymentInstructionNumber": "PIN-12345",
    "bfsTransactionId": "BFS-TXN-67890",
    "amount": 1500,
    "bankList": [...]
  }
}
```

---

## Fail response (order created, payment initiation failed)

When the order is created and committed but payment initiation fails (e.g. gateway error), the response includes `order`, `paymentFailed: true`, and `paymentError`. **Do not** include `paymentInitiation`.

**Example (fail):**

```json
{
  "order": {
    "id": 43,
    "orderNumber": "ORD-2025-00043",
    "totalPayable": 1200.00,
    "fulfillmentStatus": "PLACED",
    "paymentStatus": "PENDING",
    "customer": {...},
    "orderItems": [...],
    "placedAt": "2025-01-15T10:05:00.000Z"
  },
  "paymentFailed": true,
  "paymentError": "Order must be in PLACED or PROCESSING status to initiate payment"
}
```

Client should:
1. Keep the `order` (e.g. show order number and amount).
2. Offer “Retry payment” using `POST /payment-settlement/initiate-payment` with body:
   ```json
   { "orderId": 43, "amount": 1200 }
   ```

---

## Cancel order (payment initiated but not completed)

Use this when the customer **abandons or cancels** after checkout—e.g. payment was successfully initiated (they have a payment instruction / bank list) but they decide not to pay or close the flow.

**Route:** `POST /orders/:id/cancel`  
**Authentication:** Optional (no guard; can be called by frontend for the customer’s own order).

### When to use

- After `POST /orders/online/checkout` returns **success** (order + `paymentInitiation`), the customer can cancel before completing payment.
- Call this with the created `order.id` to mark the order as canceled so it no longer appears as “pending payment” and is not processed.

### Request

| Item | Description |
|------|-------------|
| **Path** | `id` — order ID (e.g. from `order.id` in checkout response). |
| **Body** | `{ "reason"?: string }` — optional cancellation reason (stored in internal notes). |

### Response

**Success:** `200 OK` — full `Order` with `fulfillmentStatus: "CANCELED"`, `paymentStatus: "FAILED"`, and `canceledAt` set.

**Errors:**

- `400 Bad Request` — order is already **DELIVERED** (cannot cancel delivered orders).
- `404 Not Found` — order ID does not exist.

If the order is already **CANCELED**, the endpoint returns the order as-is (idempotent).

### Example

**Request:** `POST /orders/42/cancel`

```json
{ "reason": "Customer changed mind" }
```

**Response (200):** Order entity with `fulfillmentStatus: "CANCELED"`, `paymentStatus: "FAILED"`, `canceledAt` set.

---

## Summary

| Scenario | Request | Response |
|----------|---------|----------|
| Online checkout (single call) | `POST /orders/online/checkout` with `CreateOrderDto` | `OrderCheckoutResponseDto`: always `order`; success adds `paymentInitiation`, failure adds `paymentFailed` + `paymentError`. |
| Retry payment (after failure) | `POST /payment-settlement/initiate-payment` with `{ orderId, amount }` | Gateway response or error. |
| Cancel order (payment initiated, not completed) | `POST /orders/:id/cancel` with optional `{ reason }` | `Order` with `fulfillmentStatus: "CANCELED"`. |

Use **only** `POST /orders/online/checkout` for the initial online order; do not use a separate place-order or initiate-payment call for that flow.
