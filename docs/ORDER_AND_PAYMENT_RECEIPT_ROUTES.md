# Order, Payment Receipt, and Bank Account Routes

Overview of Order, Payment Receipt, and Bank Account API routes and entities. Auth uses `JwtAuthGuard`, `RolesGuard`, and `UserRole` from `@/modules/auth`.

---

## 1. Bank Account

### 1.1 Entity: `BankAccount`

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | INTEGER | no | PK, auto-increment |
| `accountName` | STRING | no | Display name for the account |
| `bankName` | STRING | no | Bank name |
| `accountNumber` | STRING | no | Account number |
| `isActive` | BOOLEAN | no | Default `true` |
| `useForRmaPg` | BOOLEAN | no | Default `false`. If `true`, this account is used for RMA PG / online purchases; **only one** account can have this `true` at a time. |

### 1.2 DTOs

**CreateBankAccountDto**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accountName` | string | yes | |
| `bankName` | string | yes | |
| `accountNumber` | string | yes | |
| `isActive` | boolean | no | Default `true` |
| `useForRmaPg` | boolean | no | If `true`, any other account with `useForRmaPg: true` is cleared. |

**UpdateBankAccountDto:** `PartialType(CreateBankAccountDto)` — all fields optional.

### 1.3 Routes (`/bank-accounts`)

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/bank-accounts` | Create bank account |
| `GET` | `/bank-accounts` | List all. Query: `activeOnly` (boolean, default `false`) to return only `isActive: true`. |
| `GET` | `/bank-accounts/rma-pg` | **Before `:id`.** The single account with `useForRmaPg: true`. 404 if none set. |
| `GET` | `/bank-accounts/:id` | Get one by id |
| `PATCH` | `/bank-accounts/:id` | Update (partial) |
| `DELETE` | `/bank-accounts/:id` | Delete |

**Route order:** `GET /bank-accounts/rma-pg` must be declared before `GET /bank-accounts/:id` so `rma-pg` is not treated as an id.

**`useForRmaPg` rule:** On create or update, when `useForRmaPg` is set to `true`, the service sets `useForRmaPg: false` on all other accounts first, so only one is ever `true`.

---

## 2. Unpaginated GET Routes by Order Status

These return **unpaginated** `Order[]` with: `customer`, `orderItems` (including `product`), and `orderDiscounts`.

### 2.1 To confirm – `GET /orders/admin/to-confirm` (Admin, Staff)

| | |
|---|---|
| **Filters** | `fulfillmentStatus = PLACED`, `paymentStatus = PENDING` |
| **Use** | Orders that need payment confirmation (e.g. before `POST /orders/:id/confirm`) |
| **Response** | Unpaginated `Order[]` with `customer`, `orderItems` (with `product`), `orderDiscounts` |
| **Sort** | `placedAt` descending |

### 2.2 Out for delivery (DELIVERY) – `GET /orders/admin/out-for-delivery` (Admin, Staff)

| | |
|---|---|
| **Filters** | `fulfillmentType = DELIVERY`, `fulfillmentStatus = SHIPPING` |
| **Use** | Orders out for delivery to customer's address; mark delivered with `POST /orders/:id/deliver` |
| **Response** | Unpaginated `Order[]` with `customer`, `orderItems` (with `product`), `orderDiscounts` |
| **Sort** | `shippingAt` ascending, then `placedAt` descending |

### 2.3 Ready for pickup (PICKUP / INSTORE) – `GET /orders/admin/ready-for-pickup` (Admin, Staff)

| | |
|---|---|
| **Filters** | `fulfillmentType` in `PICKUP`, `INSTORE`; `fulfillmentStatus` in `CONFIRMED`, `PROCESSING` |
| **Use** | Orders ready for customer to collect from store; mark as collected with `POST /orders/:id/mark-collected` |
| **Response** | Unpaginated `Order[]` with `customer`, `orderItems` (with `product`), `orderDiscounts` |
| **Sort** | `placedAt` ascending, then `id` ascending |

### 2.4 To track (DELIVERY) – `GET /orders/admin/to-track` (Admin, Staff)

| | |
|---|---|
| **Filters** | `fulfillmentType = DELIVERY`, `fulfillmentStatus = SHIPPING` |
| **Use** | Orders in transit; tracking dashboard or customer tracking view |
| **Response** | Unpaginated `Order[]` with `customer`, `orderItems` (with `product`), `orderDiscounts` |
| **Sort** | `shippingAt` ascending, then `placedAt` descending |

---

## 3. Route Order (Orders) — avoid `:id` collisions

Static segments must be declared **before** `GET /orders/:id`:

1. `GET /orders/admin/counts`
2. `GET /orders/admin/to-confirm`, `GET /orders/admin/out-for-delivery`, `GET /orders/admin/ready-for-pickup`, `GET /orders/admin/to-track`
3. `GET /orders/admin/to-process`, `GET /orders/admin/to-deliver`, `GET /orders/admin/unpaid-delivery`, `GET /orders/admin/completed`, `GET /orders/admin/cancelled`
4. `GET /orders/:id`

Other static routes (e.g. `POST /orders/instore/place-order`, `POST /orders/admin/counter`, `GET /orders/track`, `GET /orders/paginated`, `GET /orders/by-month`, `GET /orders/statistics/by-month`) are also defined before `GET /orders/:id`.

See **`ADMIN_WORKFLOW_AND_HISTORY_ROUTES.md`** for the 5-tab admin workflow (To Process, To Deliver, Unpaid Delivery, Completed, Cancelled) and their filters.

See **`COUNTER_ORDER_ROUTES.md`** for the 4 counter-order flows: walk-in (pay and take now), order to pay later, pay now and collect later, pay now and deliver.

---

## 4. Order Entity (summary)

Key relationships and payment-related fields:

| Field / Relation | Type | Description |
|------------------|------|-------------|
| `id`, `orderNumber`, `invoiceNumber` | | Identity |
| `customerId` | FK | → `Customer` |
| `fulfillmentStatus`, `fulfillmentType`, `orderSource` | ENUM | See enums below |
| `subTotal`, `discount`, `totalPayable`, `deliveryCost` | DECIMAL | Financial |
| `paymentStatus`, `paymentMethod`, `paidAt`, `receiptNumber`, `receiptGenerated` | | Payment summary (synced from `PaymentReceipt`s) |
| `paymentReceipts` | HasMany | → `PaymentReceipt[]` |
| `orderItems` | HasMany | → `OrderItem[]` (each with `product`) |
| `orderDiscounts` | HasMany | → `OrderDiscount[]` |
| `customer` | BelongsTo | → `Customer` |

---

## 5. Order Routes (summary)

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| `POST` | `/orders` | Create order | — |
| `POST` | `/orders/instore/place-order` | Instore/counter: pay now, INSTORE or DELIVERY. Body: `CreateOrderDto`; `orderSource` forced to COUNTER. Same behavior as admin/counter with `paymentMethod` + `fulfillmentType` INSTORE/DELIVERY. When not CASH, `bankAccountId` required. | — |
| `POST` | `/orders/admin/counter` | Counter (Admin/Staff): pay-now (INSTORE/DELIVERY/PICKUP) or order-to-pay-later. Body: `CreateOrderDto`; `orderSource` forced to COUNTER. When not CASH, `bankAccountId` required. | JWT + ADMIN or STAFF |
| `GET` | `/orders` | List orders (query params) | — |
| `GET` | `/orders/paginated` | Paginated orders. Query: `fulfillmentStatus`, `paymentStatus`, `orderSource`, `fulfillmentType`, `placedAtFrom`, `placedAtTo`. | JWT + ADMIN or STAFF |
| `GET` | `/orders/admin/counts` | Phase counts for tab badges: `{ pendingAction, inProgress, collectionGap, completed }`. | JWT + ADMIN or STAFF |
| `GET` | `/orders/admin/to-process` | Active: To Process. PLACED or CONFIRMED, and PENDING or PARTIAL. Unpaginated. | JWT + ADMIN or STAFF |
| `GET` | `/orders/admin/to-deliver` | Active: To Deliver. CONFIRMED or PROCESSING, and PAID. Unpaginated. | JWT + ADMIN or STAFF |
| `GET` | `/orders/admin/unpaid-delivery` | Active: Unpaid Delivery. DELIVERED and (PENDING or PARTIAL). Unpaginated. | JWT + ADMIN or STAFF |
| `GET` | `/orders/admin/completed` | History: Completed. DELIVERED + PAID. Paginated; `deliveredAtFrom`/`To` (default: current month). | JWT + ADMIN or STAFF |
| `GET` | `/orders/admin/cancelled` | History: Cancelled. CANCELED. Paginated; `updatedAtFrom`/`To` (default: current month). | JWT + ADMIN or STAFF |
| `GET` | `/orders/track` | Track by `orderNumber` or `phoneNumber` | — |
| `GET` | `/orders/by-month` | Orders by month (`year`, `month`) | — |
| `GET` | `/orders/statistics/by-month` | Order statistics by month | — |
| `GET` | `/orders/admin/to-confirm` | Unpaginated; PLACED + PENDING | JWT + ADMIN or STAFF |
| `GET` | `/orders/admin/out-for-delivery` | Unpaginated; DELIVERY + SHIPPING (out for delivery to address) | JWT + ADMIN or STAFF |
| `GET` | `/orders/admin/ready-for-pickup` | Unpaginated; PICKUP or INSTORE, CONFIRMED or PROCESSING (ready to collect from store) | JWT + ADMIN or STAFF |
| `GET` | `/orders/admin/to-track` | Unpaginated; DELIVERY + SHIPPING (tracking) | JWT + ADMIN or STAFF |
| `GET` | `/orders/:id` | Get one order | — |
| `GET` | `/orders/:id/customer-status` | Customer status message | — |
| `GET` | `/orders/:id/payment-receipts` | List payment receipts for order (includes `bankAccount`) | — |
| `PATCH` | `/orders/:id` | Update order | — |
| `PATCH` | `/orders/:id/status` | Update order status | — |
| `PATCH` | `/orders/:id/fulfillment-status` | Update fulfillment status | — |
| `PATCH` | `/orders/:id/payment-status` | Update payment status | — |
| `POST` | `/orders/:id/payments` | Record payment; creates `PaymentReceipt`. Body: `RecordOrderPaymentDto`. | — |
| `POST` | `/orders/:id/confirm` | Confirm order | JWT + ADMIN or STAFF |
| `POST` | `/orders/:id/ship` | Ship order | JWT + ADMIN or STAFF |
| `POST` | `/orders/:id/verify` | Verify order | — |
| `POST` | `/orders/:id/payment` | Process payment | — |
| `POST` | `/orders/:id/cancel` | Cancel order | — |
| `POST` | `/orders/:id/deliver` | Mark delivered (DELIVERY; requires SHIPPING) | JWT + ADMIN or STAFF |
| `POST` | `/orders/:id/mark-collected` | Mark collected (PICKUP or INSTORE; requires CONFIRMED or PROCESSING) | JWT + ADMIN or STAFF |
| `DELETE` | `/orders/:id` | Remove order | — |

---

## 6. Payment Receipt Entity

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | INTEGER | no | PK, auto-increment |
| `orderId` | INTEGER | no | FK → `Order` |
| `bankAccountId` | INTEGER | **yes** | FK → `BankAccount`. **Required when `paymentMethod` is not CASH** (MBOB, BDB_EPAY, TPAY, BNB_MPAY, ZPSS). `null` for CASH. |
| `receiptNumber` | STRING | no | Unique |
| `amount` | DECIMAL(10,2) | no | |
| `paymentMethod` | ENUM | no | `PaymentMethod` |
| `paidAt` | DATE | no | |
| `notes` | TEXT | yes | |
| `order` | BelongsTo | | → `Order` |
| `bankAccount` | BelongsTo | | → `BankAccount` (included in list/findOne) |

---

## 7. Payment Receipt DTOs

### CreatePaymentReceiptDto (POST /payment-receipts)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `orderId` | number | yes | |
| `amount` | number | yes | > 0 |
| `paymentMethod` | PaymentMethod | yes | |
| `bankAccountId` | number | **yes if `paymentMethod` ≠ CASH** | Must reference an existing `BankAccount`. Omit or `null` for CASH. |
| `paidAt` | string (ISO date) | no | |
| `notes` | string | no | |

### RecordOrderPaymentDto (POST /orders/:id/payments, and used by POST /payment-receipts)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | yes | > 0 |
| `paymentMethod` | PaymentMethod | yes | |
| `bankAccountId` | number | **yes if `paymentMethod` ≠ CASH** | Must reference an existing `BankAccount`. Omit for CASH. |
| `paidAt` | string (ISO date) | no | |
| `transactionId` | string | no | |
| `notes` | string | no | |

**Rule:** For `paymentMethod` in `{ MBOB, BDB_EPAY, TPAY, BNB_MPAY, ZPSS }`, `bankAccountId` is required and must exist. For `CASH`, `bankAccountId` is not sent and is stored as `null`.

---

## 8. Payment Receipt Routes

### 8.1 Standalone (`/payment-receipts`)

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/payment-receipts` | Create receipt. Body: `CreatePaymentReceiptDto` (`orderId`, `amount`, `paymentMethod`, `bankAccountId` when not CASH, `paidAt?`, `notes?`). |
| `GET` | `/payment-receipts/order/:orderId` | List payment receipts for an order. Includes `bankAccount`. |
| `GET` | `/payment-receipts/:id` | Get one by id. Includes `bankAccount`. |

### 8.2 Order-scoped (`/orders`)

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/orders/:id/payments` | Record payment (full or partial). Creates `PaymentReceipt`. Body: `RecordOrderPaymentDto`. |
| `GET` | `/orders/:id/payment-receipts` | List all `PaymentReceipt`s for the order. Includes `bankAccount`. |

---

## 9. Enums (reference)

**FulfillmentStatus:** `PLACED`, `CONFIRMED`, `PROCESSING`, `SHIPPING`, `DELIVERED`, `CANCELED`

**PaymentStatus:** `PENDING`, `PARTIAL`, `PAID`, `FAILED`

**PaymentMethod:** `CASH`, `MBOB`, `BDB_EPAY`, `TPAY`, `BNB_MPAY`, `ZPSS`

**OrderSource:** `COUNTER`, `ONLINE`

**FulfillmentType:** `DELIVERY`, `PICKUP`, `INSTORE`

---

## 10. Auth (reference)

- **Guards:** `JwtAuthGuard`, `RolesGuard` from `@/modules/auth/guards`
- **Decorator:** `@Roles(...UserRole[])` from `@/modules/auth/decorators/roles.decorator`
- **UserRole:** `ADMIN`, `STAFF`, `AFFILIATE_MARKETER`, etc. in `@/modules/auth/entities/user.entity`

Order routes that require **JWT + ADMIN or STAFF:**  
`GET /orders/paginated`, `POST /orders/:id/confirm`, `POST /orders/:id/ship`, `POST /orders/:id/deliver`.

Bank Account and Payment Receipt controllers do not currently use these guards.
