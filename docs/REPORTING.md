# Reporting Routes and DTOs

Summary of reporting API endpoints: orders and expenses by day/month/year, daily stats, monthly reports, yearly reports, and statistics.

- **Month-based routes** use query parameters **`year`** and **`month`** (required). Validation: `year` 1900–2100, `month` 1–12.
- **Daily routes** use query parameter **`date`** (required). Format: `YYYY-MM-DD` (e.g. `2025-01-15`).
- **Year-based routes** use query parameter **`year`** (required). Validation: `year` 1900–2100. Returns all 12 monthly reports for the selected year.

---

## Routes overview

| Method | Path | Description |
|--------|------|-------------|
| **Orders** | | |
| `GET` | `/orders/by-month` | List orders for a month (with customer, items, discounts) |
| `GET` | `/orders/statistics/by-month` | Order statistics for a month (counts, revenue, by status, etc.) |
| `GET` | `/orders/monthly-report` | Monthly report: total orders (≠ PLACED), revenue, total to collect |
| `GET` | `/orders/daily-stats` | Daily stats: total orders (≠ PLACED), revenue, total to collect for one day |
| `GET` | `/orders/yearly-report` | Yearly report: all 12 monthly reports for the selected year |
| **Expenses** | | |
| `GET` | `/expenses/by-month` | List expenses for a month |
| `GET` | `/expenses/monthly-report` | Monthly report: expenses aggregated by type and subtype |
| `GET` | `/expenses/daily-stats` | Daily stats: total amount, count, breakdown by type and subtype for one day |
| `GET` | `/expenses/yearly-report` | Yearly report: all 12 monthly reports for the selected year |

---

## Query parameters

### Month-based routes

| Parameter | Type | Required | Rules | Description |
|-----------|------|----------|-------|-------------|
| `year` | number | Yes | 1900–2100 | Year (e.g. 2025) |
| `month` | number | Yes | 1–12 | Month |

**Example:** `GET /orders/monthly-report?year=2025&month=1`

### Daily routes

| Parameter | Type | Required | Rules | Description |
|-----------|------|----------|-------|-------------|
| `date` | string | Yes | `YYYY-MM-DD` (ISO 8601 date) | Single day (e.g. 2025-01-15) |

**Example:** `GET /orders/daily-stats?date=2025-01-15`

### Year-based routes

| Parameter | Type | Required | Rules | Description |
|-----------|------|----------|-------|-------------|
| `year` | number | Yes | 1900–2100 | Year (e.g. 2025). Returns all 12 monthly reports for that year. |

**Example:** `GET /orders/yearly-report?year=2025`

---

## Order reporting

### GET /orders/by-month

Returns all orders in the month (by `placedAt`), with customer, order items, and discounts.

**Response:** `OrdersByMonthResponseDto`

| Field | Type | Description |
|-------|------|-------------|
| `year` | number | Year |
| `month` | number | Month (1–12) |
| `startDate` | string | ISO start of month |
| `endDate` | string | ISO end of month |
| `totalOrders` | number | Count of orders in the month |
| `orders` | Order[] | Full order entities (with customer, items, discounts) |

---

### GET /orders/statistics/by-month

Returns aggregated statistics for orders in the month (all statuses).

**Response:** `OrderStatisticsByMonthResponseDto`

| Field | Type | Description |
|-------|------|-------------|
| `year` | number | Year |
| `month` | number | Month (1–12) |
| `startDate` | string | ISO start of month |
| `endDate` | string | ISO end of month |
| `totalOrders` | number | Total orders in the month |
| `totalRevenue` | number | Sum of `totalPayable` for PAID orders |
| `totalShippingCost` | number | Sum of delivery cost |
| `averageOrderValue` | number | `completedRevenue / completedOrders` |
| `ordersByStatus` | object | Count per `FulfillmentStatus` (PLACED, CONFIRMED, …) |
| `ordersByPaymentMethod` | object | Count per payment method |
| `completedOrders` | number | Orders with status DELIVERED |
| `completedRevenue` | number | Revenue from DELIVERED + PAID orders |
| `cancelledOrders` | number | Orders with status CANCELED |
| `pendingOrders` | number | PLACED/CONFIRMED + PENDING payment |

---

### GET /orders/monthly-report

Summary for the month: orders excluding PLACED, revenue from paid orders, and total still to collect.

**Response:** `OrderMonthlyReportResponseDto`

| Field | Type | Description |
|-------|------|-------------|
| `year` | number | Year |
| `month` | number | Month (1–12) |
| `totalOrders` | number | Count of orders with `fulfillmentStatus !== PLACED` |
| `revenue` | number | Sum of `totalPayable` for orders with `paymentStatus === PAID` |
| `totalToCollect` | number | Sum of (totalPayable − totalPaid) for orders with PENDING or PARTIAL payment |

**Example response:**

```json
{
  "year": 2025,
  "month": 1,
  "totalOrders": 42,
  "revenue": 125000.50,
  "totalToCollect": 8500.00
}
```

---

### GET /orders/daily-stats

Daily summary: total orders (excluding PLACED), revenue, and total to collect for one day (by `placedAt`).

**Query:** `date` (required) — `YYYY-MM-DD`.

**Response:** `OrderDailyStatsResponseDto`

| Field | Type | Description |
|-------|------|-------------|
| `date` | string | Date (YYYY-MM-DD) |
| `totalOrders` | number | Count of orders on the day with `fulfillmentStatus !== PLACED` |
| `revenue` | number | Sum of `totalPayable` for orders with `paymentStatus === PAID` |
| `totalToCollect` | number | Sum of (totalPayable − totalPaid) for orders with PENDING or PARTIAL payment |

**Example:** `GET /orders/daily-stats?date=2025-01-15`

```json
{
  "date": "2025-01-15",
  "totalOrders": 8,
  "revenue": 12500.00,
  "totalToCollect": 1500.00
}
```

---

### GET /orders/yearly-report

Year-wise report: all 12 monthly reports for the selected year (orders ≠ PLACED, revenue, total to collect per month).

**Query:** `year` (required) — 1900–2100.

**Response:** `OrderYearlyReportResponseDto`

| Field | Type | Description |
|-------|------|-------------|
| `year` | number | Year (e.g. 2025) |
| `monthlyReports` | array | 12 entries (months 1–12); each item has same shape as `GET /orders/monthly-report`: `year`, `month`, `totalOrders`, `revenue`, `totalToCollect` |

**Example:** `GET /orders/yearly-report?year=2025`

```json
{
  "year": 2025,
  "monthlyReports": [
    { "year": 2025, "month": 1, "totalOrders": 42, "revenue": 125000.50, "totalToCollect": 8500.00 },
    { "year": 2025, "month": 2, "totalOrders": 38, "revenue": 98000.00, "totalToCollect": 5200.00 },
    "... months 3–12 ..."
  ]
}
```

---

## Expense reporting

### GET /expenses/by-month

Returns all expenses in the month (by expense `date`).

**Response:** Array of `Expense` entities (ordered by date DESC).

---

### GET /expenses/monthly-report

Expenses for the month aggregated by `type` and `subtype`.

**Response:** `ExpenseMonthlyReportResponseDto`

| Field | Type | Description |
|-------|------|-------------|
| `year` | number | Year |
| `month` | number | Month (1–12) |
| `byTypeAndSubtype` | array | One entry per (type, subtype) with `type`, `subtype`, `count`, `totalAmount` |

Each item in `byTypeAndSubtype`: `ExpenseByTypeSubtypeItemDto`

| Field | Type | Description |
|-------|------|-------------|
| `type` | string \| null | Expense type (e.g. "Operating", "Marketing") |
| `subtype` | string \| null | Expense subtype (e.g. "Rent", "Ads") |
| `count` | number | Number of expenses in this group |
| `totalAmount` | number | Sum of amount for this group |

**Example response:**

```json
{
  "year": 2025,
  "month": 1,
  "byTypeAndSubtype": [
    { "type": "Operating", "subtype": "Rent", "count": 1, "totalAmount": 500 },
    { "type": "Marketing", "subtype": "Ads", "count": 3, "totalAmount": 1200.50 },
    { "type": null, "subtype": null, "count": 2, "totalAmount": 150.00 }
  ]
}
```

---

### GET /expenses/daily-stats

Daily expense stats: total amount, count, and breakdown by type and subtype for one day (by expense `date`).

**Query:** `date` (required) — `YYYY-MM-DD`.

**Response:** `ExpenseDailyStatsResponseDto`

| Field | Type | Description |
|-------|------|-------------|
| `date` | string | Date (YYYY-MM-DD) |
| `totalAmount` | number | Total expense amount for the day |
| `count` | number | Number of expenses on the day |
| `byTypeAndSubtype` | array | One entry per (type, subtype): `type`, `subtype`, `count`, `totalAmount` (same shape as monthly report) |

**Example:** `GET /expenses/daily-stats?date=2025-01-15`

```json
{
  "date": "2025-01-15",
  "totalAmount": 650.50,
  "count": 4,
  "byTypeAndSubtype": [
    { "type": "Operating", "subtype": "Rent", "count": 1, "totalAmount": 500 },
    { "type": "Marketing", "subtype": "Ads", "count": 2, "totalAmount": 100.50 },
    { "type": null, "subtype": null, "count": 1, "totalAmount": 50.00 }
  ]
}
```

---

### GET /expenses/yearly-report

Year-wise report: all 12 monthly reports for the selected year (expenses by type and subtype per month).

**Query:** `year` (required) — 1900–2100. Validated via `YearQueryDto` (expense module).

**Response:** `ExpenseYearlyReportResponseDto`

| Field | Type | Description |
|-------|------|-------------|
| `year` | number | Year (e.g. 2025) |
| `monthlyReports` | array | 12 entries (months 1–12); each item has same shape as `GET /expenses/monthly-report`: `year`, `month`, `byTypeAndSubtype` |

**Example:** `GET /expenses/yearly-report?year=2025`

```json
{
  "year": 2025,
  "monthlyReports": [
    { "year": 2025, "month": 1, "byTypeAndSubtype": [ { "type": "Operating", "subtype": "Rent", "count": 1, "totalAmount": 500 }, "..." ] },
    { "year": 2025, "month": 2, "byTypeAndSubtype": [ "..." ] },
    "... months 3–12 ..."
  ]
}
```

---

## DTOs reference

| DTO | Used by |
|-----|---------|
| `MonthQueryDto` | Order month-based routes (year, month validation) |
| `ExpenseByMonthQueryDto` | Expense month-based routes (year, month validation) |
| `OrderDailyStatsQueryDto` | Order daily route (`date` validation) |
| `ExpenseDailyStatsQueryDto` | Expense daily route (`date` validation) |
| `OrdersByMonthResponseDto` | `GET /orders/by-month` |
| `OrderStatisticsByMonthResponseDto` | `GET /orders/statistics/by-month` |
| `OrderMonthlyReportResponseDto` | `GET /orders/monthly-report` |
| `OrderDailyStatsResponseDto` | `GET /orders/daily-stats` |
| `OrderYearlyReportResponseDto` | `GET /orders/yearly-report` |
| `YearQueryDto` (order) | Order yearly route (`year` validation) |
| `ExpenseMonthlyReportResponseDto` | `GET /expenses/monthly-report` |
| `ExpenseDailyStatsResponseDto` | `GET /expenses/daily-stats` |
| `ExpenseYearlyReportResponseDto` | `GET /expenses/yearly-report` |
| `YearQueryDto` (expense) | Expense yearly route (`year` validation) |
| `ExpenseByTypeSubtypeItemDto` | Item in monthly/daily expense report `byTypeAndSubtype` |
