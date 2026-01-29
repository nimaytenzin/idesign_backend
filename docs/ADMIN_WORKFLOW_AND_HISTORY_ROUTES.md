# Admin Workflow and History Tabs – Routes and Logic

This document describes the **5-tab** admin order management API: **3 Active Workflow** tabs (real-time, unpaginated) and **2 History** tabs (paginated, date-filtered).

---

## 1. Active Workflow Tabs (Real-time / No Pagination)

These tabs use **lightweight GET** endpoints so the admin sees the full “to-do” list. All require **JWT + ADMIN or STAFF**.

| Tab | Route | Logic (fulfillmentStatus + paymentStatus) | Primary Action |
|-----|-------|-------------------------------------------|----------------|
| **1. To Process** | `GET /orders/admin/to-process` | (PLACED \| CONFIRMED) + (PENDING \| PARTIAL) | Record Payment / Confirm Order |
| **2. To Deliver** | `GET /orders/admin/to-deliver` | (CONFIRMED \| PROCESSING) + PAID | Ship Order (Assign Driver) |
| **3. Unpaid Delivery** | `GET /orders/admin/unpaid-delivery` | DELIVERED + (PENDING \| PARTIAL) | Record Final Payment |

### 1.1 To Process – `GET /orders/admin/to-process`

| | |
|---|---|
| **Meaning** | Unpaid & Not Delivered |
| **Filters** | `fulfillmentStatus IN (PLACED, CONFIRMED)` AND `paymentStatus IN (PENDING, PARTIAL)` |
| **Response** | Unpaginated `Order[]` with `customer`, `orderItems` (with `product`), `orderDiscounts` |
| **Sort** | `placedAt` DESC |
| **Primary actions** | Record Payment (`POST /orders/:id/payments`), Confirm Order (`POST /orders/:id/confirm`), Cancel |

**COD (Ship-before-pay):** If you allow Cash on Delivery / “ship-before-pay,” the **Ship** button can be enabled in this tab even when unpaid. In that case the order can move from To Process → (skip To Deliver) → Unpaid Delivery once delivered. This requires `POST /orders/:id/ship` to accept unpaid orders (e.g. via an `allowUnpaid` flag or relaxed payment check). Today `shipOrder` requires `paymentStatus=PAID`.

### 1.2 To Deliver – `GET /orders/admin/to-deliver`

| | |
|---|---|
| **Meaning** | Paid & Not Delivered |
| **Filters** | `fulfillmentStatus IN (CONFIRMED, PROCESSING)` AND `paymentStatus = PAID` |
| **Response** | Unpaginated `Order[]` with `customer`, `orderItems` (with `product`), `orderDiscounts` |
| **Sort** | `placedAt` DESC |
| **Primary action** | Ship Order (`POST /orders/:id/ship` – driver, vehicle, expected delivery date) |

**Note:** This is “ready to ship,” not “out for delivery.” For orders already in transit, use `GET /orders/admin/out-for-delivery` (DELIVERY + SHIPPING).

### 1.3 Unpaid Delivery – `GET /orders/admin/unpaid-delivery`

| | |
|---|---|
| **Meaning** | Delivered but Unpaid |
| **Filters** | `fulfillmentStatus = DELIVERED` AND `paymentStatus IN (PENDING, PARTIAL)` |
| **Response** | Unpaginated `Order[]` with `customer`, `orderItems` (with `product`), `orderDiscounts` |
| **Sort** | `deliveredAt` DESC, then `placedAt` DESC |
| **Primary action** | Record Final Payment (`POST /orders/:id/payments`) |

---

## 2. History Tabs (Paginated + Date Filter)

These use **paginated** endpoints with **mandatory date ranges**. Default when `*From`/`*To` are omitted: **current month**. All require **JWT + ADMIN or STAFF**.

| Tab | Route | Logic | Default Date Filter |
|-----|-------|-------|---------------------|
| **4. Completed** | `GET /orders/admin/completed` | DELIVERED + PAID | `deliveredAt` in current month |
| **5. Cancelled** | `GET /orders/admin/cancelled` | CANCELED | `updatedAt` in current month |

### 2.1 Completed – `GET /orders/admin/completed`

| | |
|---|---|
| **Meaning** | Finalized (Delivered & Paid) |
| **Filters** | `fulfillmentStatus = DELIVERED`, `paymentStatus = PAID`, `deliveredAt` in range |
| **Query** | `deliveredAtFrom` (optional), `deliveredAtTo` (optional), `page`, `limit` |
| **Default range** | If both `deliveredAtFrom` and `deliveredAtTo` are omitted: current month (start 00:00:00 – last day 23:59:59) |
| **Response** | `PaginatedResponseDto<Order>`: `{ data: Order[], meta: { total, page, limit, totalPages, hasNextPage, hasPreviousPage } }` |
| **Sort** | `deliveredAt` DESC, then `placedAt` DESC |

**Example:**

- `GET /orders/admin/completed` → current month
- `GET /orders/admin/completed?deliveredAtFrom=2025-01-01&deliveredAtTo=2025-01-31&page=1&limit=20`

### 2.2 Cancelled – `GET /orders/admin/cancelled`

| | |
|---|---|
| **Meaning** | Voided |
| **Filters** | `fulfillmentStatus = CANCELED`, `updatedAt` in range |
| **Query** | `updatedAtFrom` (optional), `updatedAtTo` (optional), `page`, `limit` |
| **Default range** | If both `updatedAtFrom` and `updatedAtTo` are omitted: current month |
| **Response** | `PaginatedResponseDto<Order>` (same shape as Completed) |
| **Sort** | `updatedAt` DESC, then `placedAt` DESC |

**Example:**

- `GET /orders/admin/cancelled` → current month
- `GET /orders/admin/cancelled?updatedAtFrom=2025-01-01&updatedAtTo=2025-01-31&page=1&limit=20`

---

## 3. Route Summary

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/orders/admin/to-process` | JWT, ADMIN/STAFF | Active: To Process (unpaginated) |
| `GET` | `/orders/admin/to-deliver` | JWT, ADMIN/STAFF | Active: To Deliver / ready to ship (unpaginated) |
| `GET` | `/orders/admin/unpaid-delivery` | JWT, ADMIN/STAFF | Active: Unpaid Delivery (unpaginated) |
| `GET` | `/orders/admin/completed` | JWT, ADMIN/STAFF | History: Completed (paginated, `deliveredAt`; default current month) |
| `GET` | `/orders/admin/cancelled` | JWT, ADMIN/STAFF | History: Cancelled (paginated, `updatedAt`; default current month) |

**Route order:** All of the above must be declared **before** `GET /orders/:id` so `admin/...` paths are not matched as `:id`.

---

## 4. DTOs

- **GetOrdersCompletedQueryDto** (extends `PaginationQueryDto`): `deliveredAtFrom?`, `deliveredAtTo?`, `page?`, `limit?`
- **GetOrdersCancelledQueryDto** (extends `PaginationQueryDto`): `updatedAtFrom?`, `updatedAtTo?`, `page?`, `limit?`

---

## 5. Related Endpoints (for primary actions)

| Action | Endpoint |
|--------|----------|
| Record / Confirm payment | `POST /orders/:id/confirm`, `POST /orders/:id/payments` |
| Ship order | `POST /orders/:id/ship` |
| Mark delivered | `POST /orders/:id/deliver` |
| Cancel | `POST /orders/:id/cancel` |

---

## 6. Enums (reference)

- **FulfillmentStatus:** `PLACED`, `CONFIRMED`, `PROCESSING`, `SHIPPING`, `DELIVERED`, `CANCELED`
- **PaymentStatus:** `PENDING`, `PARTIAL`, `PAID`, `FAILED`

---

*See also: `ORDER_AND_PAYMENT_RECEIPT_ROUTES.md`, `ORDER_MANAGEMENT_ADMIN_UI_SUGGESTIONS.md`.*
