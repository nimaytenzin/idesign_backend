# Order Management Admin UI – Design Suggestions & Documentation

This document suggests how to categorize and design the **admin order management frontend** when orders are **not** always processed only after payment. It covers: pay-before-ship, deliver-before-pay (e.g. COD, trust), delivered-but-unpaid, and partial payments.

---

## 1. Limitations of the Current Design

### 1.1 Current Buckets (Action-Based)

| Bucket       | Backend | Filters                          | Implied action                         |
|-------------|---------|-----------------------------------|----------------------------------------|
| **To Confirm** | `GET /orders/to-confirm` | `fulfillmentStatus=PLACED`, `paymentStatus=PENDING` | Collect/record payment → `POST /orders/:id/confirm` |
| **To Deliver** | `GET /orders/to-deliver` | `fulfillmentStatus=SHIPPING`       | Mark as delivered → `POST /orders/:id/deliver`      |
| **To Track**   | `GET /orders/to-track`   | `fulfillmentStatus=SHIPPING`       | View in-transit orders (same data as To Deliver)    |

### 1.2 Core Assumption: “Pay Before Process”

The current flow assumes:

1. **Payment first:** `POST /orders/:id/confirm` records payment and moves PLACED → CONFIRMED.
2. **Ship only when paid:** `POST /orders/:id/ship` **requires** `paymentStatus=PAID`. You cannot ship if the order is PENDING or PARTIAL.
3. **To Confirm = “collect payment before we do anything”** — which does not fit when you intend to deliver first and collect on delivery (COD) or on trust.

### 1.3 Gaps vs. Real Operations

| Scenario | Current support | Issue |
|----------|-----------------|-------|
| **Pay before ship** | ✅ Supported | To Confirm → Confirm → Ship → Deliver works. |
| **Ship/deliver before pay (COD, trust)** | ❌ Blocked | `shipOrder` requires PAID. You cannot move to SHIPPING when payment is PENDING. |
| **Delivered but not paid** | ⚠️ Partial | `markOrderAsDelivered` does not check payment. If you reach DELIVERED via `PATCH /orders/:id/fulfillment-status`, you can have DELIVERED + PENDING. No dedicated “delivered–unpaid” view. |
| **Partial payments** | ⚠️ Data only | `PaymentStatus.PARTIAL` and `POST /orders/:id/payments` exist, but no bucket or primary action for “collect remainder.” |
| **To Deliver vs To Track** | ⚠️ Redundant | Both use `fulfillmentStatus=SHIPPING`; they differ only by UI (list vs tracking). |

### 1.4 Summary of Why a Redesign Helps

- **Payment and fulfillment are independent in reality:** You sometimes collect before shipping, sometimes after. The UI should not force a single sequence.
- **Actions should match business need:** “Collect payment” and “Mark delivered” are both first-class; the list should surface “needs payment” and “needs delivery update” separately.
- **Unpaid delivered orders need visibility:** Delivered-but-unpaid (and overdue) should be easy to find for follow-up.
- **Partial payments need a clear next step:** “Collect remainder” should be a visible action.

---

## 2. Proposed Categorization: Operational Phases (4 Tabs)

Instead of having 7+ tabs based on status combinations, group them by **Operational Phase**. This reduces the number of tabs an admin has to click through. Each phase has an **owner** (role) and combines multiple status-based buckets, aligning the UI with who does the work.

---

### 2.1 Four Phase Tabs (Admin Views)

| # | Phase (Tab) | What it replaces | Who owns it? | The "Why" |
|---|-------------|------------------|--------------|-----------|
| 1 | **Pending Action** | Awaiting Payment + Ready to Fulfill | Admin / Sales | Orders that haven't moved yet. You either need to **Confirm Payment** or **Release to Warehouse**. |
| 2 | **In Progress** | Out for Delivery + To Track | Logistics | Orders being packed or currently on the road. The goal is to **Mark Delivered**. |
| 3 | **Collection Gap** | Delivered – Unpaid + Partial Payment | Accounts | The **"Risk"** bucket. Orders where the customer has the goods but you don't have all the money. |
| 4 | **Completed** | Delivered & Paid + Canceled | Archive | No further action required. |

---

### 2.2 What Goes in Each Phase (Backend Filters)

| Phase | Included status combinations | Sub-sections (optional in UI) | Primary action(s) |
|-------|------------------------------|-------------------------------|-------------------|
| **Pending Action** | • `PLACED` + `PENDING` (Awaiting Payment)<br>• `CONFIRMED` or `PROCESSING` + `PAID` or `PENDING`* (Ready to Fulfill) | "Awaiting Payment" / "Ready to Fulfill" as chips or columns | Record payment (`/confirm` or `/payments`), Cancel; **or** Ship / Release to Warehouse |
| **In Progress** | • `SHIPPING` (Out for Delivery = To Track, same data) | List view + Track view (map/timeline) | Mark delivered (`POST /orders/:id/deliver`), Track |
| **Collection Gap** | • `DELIVERED` + (`PENDING` or `PARTIAL`) (Delivered – Unpaid)<br>• `PARTIAL` + fulfillmentStatus ∉ {DELIVERED, CANCELED} (Partial – collect remainder) | "Delivered – Unpaid" / "Partial (not yet delivered)" as chips or columns | Record payment (`POST /orders/:id/payments`) |
| **Completed** | • `DELIVERED` + `PAID`<br>• `CANCELED` | "Delivered & Paid" / "Canceled" as chips or columns | View only, receipts, feedback |

\* `PENDING` in Ready to Fulfill only if you allow ship-before-pay (COD/trust); see §4.2.

---

### 2.3 How This Supports Your Cases

| Case | Phase(s) | Primary action |
|------|----------|----------------|
| **Pay before process** | Pending Action (Awaiting Payment → Ready to Fulfill) → In Progress → Completed | Confirm payment → Release/Ship → Mark delivered |
| **Deliver before pay (COD, trust)** | Pending Action (Ready to Fulfill with PENDING) → In Progress → **Collection Gap** (Delivered – Unpaid) → Completed | Ship (if backend allows unpaid) → Mark delivered → **Record payment** |
| **Partial payments** | **Collection Gap** (Partial and/or Delivered – Unpaid) | Record payment until PAID |
| **Delivered but unpaid** | **Collection Gap** (Delivered – Unpaid) | Record payment |

---

## 3. Frontend UI Structure

### 3.1 Tabs or Sections (High Level)

Use **4 phase tabs** so staff can switch by operational phase (fewer clicks than 7+ status-based tabs):

```
[ Pending Action ] [ In Progress ] [ Collection Gap ] [ Completed ]
```

- **Badges:** Show count per phase when feasible (e.g. from `GET /orders/admin-counts` or derived from first page).
- **Default tab:** “Pending Action” or “In Progress,” depending on what staff use most.
- **Within each tab:** use sub-sections or filter chips (e.g. "Awaiting Payment" / "Ready to Fulfill" in Pending Action; "Delivered – Unpaid" / "Partial" in Collection Gap) so the right owner can focus.

Optional: an “All” or “Search” tab that uses `GET /orders/paginated` with filters.

---

### 3.2 Per-Tab: List + Filters + Primary Actions

Each tab shows a **paginated list** (reuse `GET /orders/paginated` or new `GET /orders/admin-views/...`). For each row, show at least:

- Order number, customer, `placedAt`
- `fulfillmentStatus`, `paymentStatus`
- `totalPayable`, amount paid so far (from `paymentReceipts` or a computed field)
- **Primary action button(s)** matching the bucket (e.g. “Record payment,” “Ship,” “Mark delivered”)

**Filters (secondary, within tab):**

- **Fulfillment type:** DELIVERY | PICKUP | INSTORE (hides “Ship” for PICKUP/INSTORE where appropriate).
- **Order source:** COUNTER | ONLINE.
- **Date range:** `placedAt` or `shippingAt` / `deliveredAt` depending on tab.

---

### 3.3 Order Detail: Action-Centric Layout

On the order detail page:

- **Status cards:** Fulfillment and Payment with clear labels.
- **Action buttons** by state:
  - PLACED + PENDING: “Record payment” (opens confirm/payment modal) and “Cancel.”
  - CONFIRMED/PROCESSING + PAID (or PENDING if ship-before-pay): “Ship” (for DELIVERY) or “Mark ready for pickup” / “Mark delivered” (PICKUP/INSTORE).
  - SHIPPING: “Mark delivered” and “Track.”
  - DELIVERED + (PENDING | PARTIAL): “Record payment.”
- **Payment history:** List `GET /orders/:id/payment-receipts` with amounts and dates.

---

### 3.4 “Out for delivery” and “To Track”

- **One dataset:** `fulfillmentStatus=SHIPPING`.
- **Two presentations:**
  - **List view:** Table with “Mark delivered,” driver, `expectedDeliveryDate`, `vehicleNumber`.
  - **Track view:** Same list in a map or timeline; “Track” from list opens this or a detail view with map. No new backend; same `GET /orders/to-deliver` or `paginated?fulfillmentStatus=SHIPPING`.

---

## 4. Backend Changes to Support This

### 4.1 Optional: Phase-Based Admin Endpoints

You can keep `GET /orders/paginated` and add `fulfillmentStatus` + `paymentStatus` as query params. Alternatively, add **4 phase-based endpoints** that match the tabs (each aggregates the filters from §2.2):

| Endpoint (suggested) | Phase | Filters | Use |
|----------------------|-------|---------|-----|
| `GET /orders/admin/pending-action` | Pending Action | (PLACED + PENDING) ∪ (CONFIRMED or PROCESSING + PAID or PENDING*) | Awaiting Payment + Ready to Fulfill |
| `GET /orders/admin/in-progress` | In Progress | SHIPPING | Out for delivery (+ Track view) |
| `GET /orders/admin/collection-gap` | Collection Gap | (DELIVERED + (PENDING or PARTIAL)) ∪ (PARTIAL + not DELIVERED/CANCELED) | Delivered – Unpaid + Partial (collect remainder) |
| `GET /orders/admin/completed` | Completed | (DELIVERED + PAID) ∪ CANCELED | Delivered & Paid + Canceled |

\* PENDING in Pending Action only if you allow ship-before-pay; see §4.2.

All can return **paginated** `Order[]` with `customer`, `orderItems` (with `product`), `orderDiscounts`, and optionally `paymentReceipts` or a `totalPaid` summary. Within each response, a `subPhase` or `fulfillmentStatus`/`paymentStatus` lets the frontend render chips (e.g. "Awaiting Payment" vs "Ready to Fulfill" in Pending Action).

---

### 4.2 Allow “Ship Before Pay” (COD / Trust)

Today, `POST /orders/:id/ship` requires `paymentStatus=PAID`. To support COD and trust:

**Option A – Configurable (recommended):**  
Add a query or body flag, e.g. `allowUnpaid: boolean`. If `allowUnpaid=true` (and only for ADMIN, or ADMIN+STAFF with a role check), allow `shipOrder` when `paymentStatus` is PENDING or PARTIAL. Log that it was shipped unpaid for audit.

**Option B – Unconditional:**  
Remove the PAID check in `shipOrder` and rely on business process. Simpler but less explicit.

**Option C – Order-level “payment timing”:**  
Add something like `paymentTiming: 'BEFORE_SHIP' | 'ON_DELIVERY' | 'AFTER_DELIVERY'` on the order. `shipOrder` allows PENDING/PARTIAL only when `paymentTiming !== 'BEFORE_SHIP'`. More model change, but very clear.

Recommendation: **Option A** as a first step; Option C if you want to drive analytics and reporting by payment timing.

---

### 4.3 Extend `GET /orders/paginated` (Minimum Viable)

If you prefer not to add many new routes, extend the existing DTO and logic:

- **Query params:**  
  `fulfillmentStatus`, `paymentStatus`, `fulfillmentType`, `orderSource`, `placedAtFrom`, `placedAtTo`, etc.

Then the frontend can emulate each **phase** (or use phase endpoints in 4.1):

- **Pending Action:** (Awaiting payment) `?fulfillmentStatus=PLACED&paymentStatus=PENDING`; (Ready to fulfill) `?fulfillmentStatus=CONFIRMED` or `PROCESSING`, `paymentStatus=PAID` (or `PENDING` if 4.2).
- **In Progress:** `?fulfillmentStatus=SHIPPING`
- **Collection Gap:** `?fulfillmentStatus=DELIVERED&paymentStatusIn=PENDING,PARTIAL` or `?paymentStatus=PARTIAL` excluding DELIVERED/CANCELED.
- **Completed:** (Delivered & paid) `?fulfillmentStatus=DELIVERED&paymentStatus=PAID`; (Canceled) `?fulfillmentStatus=CANCELED`

---

### 4.4 Counts for Phase Tab Badges

Optional: `GET /orders/admin/counts` returning **4 phase counts**:

```json
{
  "pendingAction": 20,
  "inProgress": 4,
  "collectionGap": 5,
  "completed": 128
}
```

Implement by running grouped counts with the same filters as §2.2 / 4.1. Keeps phase tab badges in sync without loading full lists.

---

## 5. Mapping: Old vs New (by Phase)

| Old bucket | Phase (Tab) | Sub-bucket / contents | Notes |
|------------|-------------|------------------------|-------|
| To Confirm | **Pending Action** | Awaiting Payment | Same filters (PLACED + PENDING). |
| *(none)* | **Pending Action** | Ready to Fulfill | CONFIRMED or PROCESSING + PAID (or PENDING if ship-before-pay). |
| To Deliver | **In Progress** | Out for delivery | Same SHIPPING; “Mark delivered” is the main action. |
| To Track | **In Progress** | Track view | Same SHIPPING data; different layout (map/timeline). |
| *(none)* | **Collection Gap** | Delivered – Unpaid | DELIVERED + PENDING or PARTIAL. |
| *(none)* | **Collection Gap** | Partial (not yet delivered) | PARTIAL, not DELIVERED/CANCELED. |
| *(none)* | **Completed** | Delivered & Paid | View only. |
| *(none)* | **Completed** | Canceled | View only. |

---

## 6. Reasons for This Design (Summary)

1. **Payment and fulfillment are decoupled in the UI** — Buckets are based on “what’s the next action?” (payment vs. fulfill vs. deliver vs. collect-after-delivery), so both pay-before and deliver-before-pay flows are natural.
2. **“Delivered – collect payment”** — Makes delivered-but-unpaid (and overdue) visible and gives a clear next step.
3. **“Partial payment – collect remainder”** — Surfaces PARTIAL so staff can chase the balance at any stage.
4. **“Ready to fulfill”** — Separates “we have payment (or we’re doing COD), now we work on the order” from “we’re waiting for money.”
5. **One “Out for delivery” with List + Track** — Removes the duplicate to-deliver / to-track buckets while keeping both use cases.
6. **Backend stays flexible** — Either extend `paginated` with `paymentStatus` and more filters, or add small admin-view endpoints. Relaxing `shipOrder` (e.g. with `allowUnpaid`) is the key change for COD/trust.

---

## 7. Implementation Order (Suggested)

1. **Frontend**
   - Add `paymentStatus` (and optionally `fulfillmentType`, `orderSource`) to `GET /orders/paginated` requests.
   - Rebuild **4 phase tabs:** Pending Action, In Progress, Collection Gap, Completed. Use sub-sections or filter chips within each (e.g. Awaiting Payment / Ready to Fulfill in Pending Action; Delivered – Unpaid / Partial in Collection Gap).
   - Merge “To Deliver” and “To Track” into **In Progress** (one SHIPPING list with List + Track view).
   - On order detail, show payment vs. fulfillment and enable “Record payment” for PENDING/PARTIAL and “Mark delivered” for SHIPPING.
2. **Backend**
   - Add `paymentStatus` (and if needed `fulfillmentType`, `orderSource`, date range, or `operationalPhase`) to `GetOrdersPaginatedQueryDto` and `getOrdersPaginated`.
   - (Optional) Add `GET /orders/admin/counts` returning `pendingAction`, `inProgress`, `collectionGap`, `completed` for phase tab badges.
   - (Optional) Add 4 phase endpoints (`/orders/admin/pending-action`, `in-progress`, `collection-gap`, `completed`) or an `operationalPhase` query param.
   - (Optional) Add `allowUnpaid` to `POST /orders/:id/ship` so COD/trust can move to SHIPPING before payment.

---

## 8. Reference: Enums and Key Endpoints

**FulfillmentStatus:** `PLACED`, `CONFIRMED`, `PROCESSING`, `SHIPPING`, `DELIVERED`, `CANCELED`  
**PaymentStatus:** `PENDING`, `PARTIAL`, `PAID`, `FAILED`  
**FulfillmentType:** `DELIVERY`, `PICKUP`, `INSTORE`  
**OrderSource:** `COUNTER`, `ONLINE`

**Relevant endpoints:**

- `GET /orders/paginated` – paginated list. Query: `fulfillmentStatus`, `paymentStatus`, `orderSource`, `fulfillmentType`, `placedAtFrom`, `placedAtTo` (supports Delivered & Paid, Collection Gap, month/date).
- `GET /orders/admin/counts` – phase counts `{ pendingAction, inProgress, collectionGap, completed }` for tab badges (JWT + ADMIN or STAFF).
- `GET /orders/to-confirm` – PLACED + PENDING (maps to Awaiting payment)
- `GET /orders/to-deliver`, `GET /orders/to-track` – SHIPPING (replace with one Out for delivery + Track view)
- `POST /orders/:id/confirm` – record payment, PLACED→CONFIRMED, PENDING→PAID
- `POST /orders/:id/payments` – record full or partial payment (`RecordOrderPaymentDto`)
- `POST /orders/:id/ship` – set SHIPPING and driver/vehicle/ETA (today: requires PAID)
- `POST /orders/:id/deliver` – set DELIVERED
- `PATCH /orders/:id/fulfillment-status`, `PATCH /orders/:id/payment-status` – manual overrides
- `GET /orders/:id/payment-receipts` – list payments for the order

---

## 9. Implementation Follow-ups

| Item | Where | Status / Notes |
|------|-------|----------------|
| **Record payment** | Frontend | `recordPayment` should open `AdminViewOrderComponent` with `highlightPayment: true`. Add a dedicated **Record payment** flow (e.g. form calling `POST /orders/:id/payments` and `RecordOrderPaymentDto`). Backend: `POST /orders/:id/payments` and DTO exist. |
| **PICKUP/INSTORE in Pending Action** | Frontend | For CONFIRMED/PROCESSING with **PICKUP** or **INSTORE**, show **"Mark ready for pickup"** or **"Mark delivered"** instead of **"Ship"**. Only **DELIVERY** shows **"Ship"**. Backend: `POST /orders/:id/deliver` and `fulfillmentType` support this. |
| **Track view (In Progress)** | Frontend | The design’s **Track view** (map/timeline for `SHIPPING`) is not implemented; only the list view exists. Reuse `GET /orders/to-deliver` or `paginated?fulfillmentStatus=SHIPPING` for data. |
| **Phase counts** | Backend ✅ / Frontend | **Backend:** `GET /orders/admin/counts` and `getAdminPhaseCounts` implemented. **Frontend:** wire phase tab badges to this endpoint. |
| **Month/date filter** | Backend ✅ / Frontend | **Backend:** `GET /orders/paginated` supports `placedAtFrom` and `placedAtTo`. **Frontend:** pass `placedAtFrom` / `placedAtTo` from the month/date selector into `loadOrdersForPhase` (or equivalent) when calling `getOrdersPaginated`. |

---

*Document version: 1.1. See also: `ORDER_AND_PAYMENT_RECEIPT_ROUTES.md`, `PRODUCT_ENTITY_CHANGES.md`.*
