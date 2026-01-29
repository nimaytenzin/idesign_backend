# Counter Order Routes and Flows

All counter orders use a **single route** `POST /orders/admin/counter` (Admin/Staff). The flow is chosen by **paymentMethod** and **fulfillmentType** in the body. `orderSource` is forced to `COUNTER`.

---

## 1. The Four Counter-Order Types (one route)

| # | Scenario | Body | Result |
|---|----------|------|--------|
| **1** | **Pay now, collect at shop (INSTORE)** | `paymentMethod`, `fulfillmentType: "INSTORE"` | CONFIRMED + PAID; collect later → `POST /orders/:id/mark-collected` |
| **2** | **Order to pay later** | **No** `paymentMethod`; `fulfillmentType` required: INSTORE, PICKUP, or DELIVERY | PLACED + PENDING; pay and fulfill later |
| **3** | **Pay now, collect later (PICKUP)** | `paymentMethod`, `fulfillmentType: "PICKUP"` or omitted | CONFIRMED + PAID (PICKUP); collect later → `POST /orders/:id/mark-collected` |
| **4** | **Pay now, deliver to address (DELIVERY)** | `paymentMethod`, `fulfillmentType: "DELIVERY"`, `deliveryRateId`, `shippingAddress` | PROCESSING + PAID; then `POST /orders/:id/ship` and `POST /orders/:id/deliver` |

---

## 2. Route: `POST /orders/admin/counter`

**Auth:** JWT + ADMIN or STAFF.

**Body:** `CreateOrderDto`. `orderSource` is set by the backend.

**Branching:**

- **paymentMethod provided + fulfillmentType INSTORE or DELIVERY** → pay-now (instorePlaceOrder): INSTORE→CONFIRMED+PAID, DELIVERY→PROCESSING+PAID (requires `deliveryRateId`, `shippingAddress` for DELIVERY).
- **paymentMethod provided + fulfillmentType PICKUP or omitted** → pay-now, collect later (createCounterPayNowPickupLater): PICKUP, CONFIRMED+PAID.
- **paymentMethod not provided** → order to pay later (createCounterOrderToPayLater): `fulfillmentType` **required** (INSTORE, PICKUP, or DELIVERY). For DELIVERY, `deliveryRateId` and `shippingAddress` required.

**When `paymentMethod` is not CASH:** `bankAccountId` is **required**.

**Optional:** `transactionId` (e.g. for pay-now PICKUP).

---

## 3. Mark as Collected (PICKUP / INSTORE)

**`POST /orders/:id/mark-collected`**  
**Auth:** JWT + ADMIN or STAFF.

| | |
|---|---|
| **Use** | Customer has come to the shop to collect. Applies only to `fulfillmentType` **PICKUP** or **INSTORE**. |
| **Preconditions** | `fulfillmentStatus` must be **CONFIRMED** or **PROCESSING**. |
| **Effect** | `fulfillmentStatus` → **DELIVERED**, `deliveredAt` = now. Product sales count incremented. |

For **DELIVERY** orders, use `POST /orders/:id/deliver` (requires `fulfillmentStatus=SHIPPING`).

---

## 4. Route Summary

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| `POST` | `/orders/admin/counter` | All counter flows: pay-now (INSTORE/DELIVERY/PICKUP) or order-to-pay-later | JWT + ADMIN or STAFF |
| `POST` | `/orders/:id/mark-collected` | Mark PICKUP/INSTORE as collected | JWT + ADMIN or STAFF |

---

## 5. DTOs

- **CreateOrderDto** – Used by `POST /orders/admin/counter`.  
  - `paymentMethod`, `fulfillmentType`, `bankAccountId` (when not CASH), `transactionId` (optional), plus customer, orderItems, etc.  
  - For order-to-pay-later: omit `paymentMethod`; `fulfillmentType` required.

---

## 6. Supporting Endpoints

| Action | Endpoint |
|--------|----------|
| Record / confirm payment | `POST /orders/:id/confirm`, `POST /orders/:id/payments` |
| Ship (DELIVERY) | `POST /orders/:id/ship` |
| Mark delivered (DELIVERY) | `POST /orders/:id/deliver` |
| Mark collected (PICKUP / INSTORE) | `POST /orders/:id/mark-collected` |
| Cancel | `POST /orders/:id/cancel` |

---

## 7. Enums (reference)

**FulfillmentType:** `DELIVERY`, `PICKUP`, `INSTORE`  
**FulfillmentStatus:** `PLACED`, `CONFIRMED`, `PROCESSING`, `SHIPPING`, `DELIVERED`, `CANCELED`  
**PaymentStatus:** `PENDING`, `PARTIAL`, `PAID`, `FAILED`  
**PaymentMethod:** `CASH`, `MBOB`, `BDB_EPAY`, `TPAY`, `BNB_MPAY`, `ZPSS`  
**OrderSource:** `COUNTER`, `ONLINE`

---

*See also: `ORDER_AND_PAYMENT_RECEIPT_ROUTES.md`, `ADMIN_WORKFLOW_AND_HISTORY_ROUTES.md`.*
