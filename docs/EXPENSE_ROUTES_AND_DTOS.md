# Expense Routes and DTOs

Summary of expense API endpoints and their DTOs.

---

## Expense entity (`type`, `subtype`)

The `Expense` entity includes:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `type` | `STRING` | Yes | Expense type (e.g. "Operating", "Marketing", "Personnel") |
| `subtype` | `STRING` | Yes | Expense subtype under `type` (e.g. "Rent", "Ads", "Salaries") |

Both are free-form; use whatever taxonomy fits your reporting. For existing databases, add the columns if you use `sync` without `alter` (e.g. `ALTER TABLE expenses ADD COLUMN type VARCHAR(255), ADD COLUMN subtype VARCHAR(255);`).

---

## Routes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/expenses` | Create (record) an expense |
| `GET` | `/expenses` | List expenses with optional `startDate` / `endDate` filters |
| `GET` | `/expenses/by-month` | List expenses for a specific month (`year`, `month` query) |
| `GET` | `/expenses/monthly-report` | Monthly report: expenses by type and subtype (see [REPORTING.md](REPORTING.md)) |
| `GET` | `/expenses/:id` | Get a single expense by ID |
| `PATCH` | `/expenses/:id` | Update an expense (partial) |
| `DELETE` | `/expenses/:id` | Delete an expense |

---

## DTOs

### CreateExpenseDto  
**Used by:** `POST /expenses`

| Field | Rules | Required |
|-------|-------|----------|
| `amount` | `@IsNumber({ maxDecimalPlaces: 2 })`, `@Min(0)`, `@Type(() => Number)` | Yes |
| `description` | `@IsString()`, `@IsNotEmpty()`, `@MaxLength(255)` | Yes |
| `date` | `@IsDateString()` (e.g. `YYYY-MM-DD`) | Yes |
| `type` | `@IsOptional()`, `@IsString()`, `@MaxLength(255)` | No |
| `subtype` | `@IsOptional()`, `@IsString()`, `@MaxLength(255)` | No |
| `notes` | `@IsOptional()`, `@IsString()`, `@MaxLength(5000)` | No |

**Example – record an expense (`POST /expenses`):**

```json
{
  "amount": 150.50,
  "description": "Office supplies",
  "date": "2025-01-15",
  "type": "Operating",
  "subtype": "Office",
  "notes": "Invoice #INV-2025-001"
}
```

---

### UpdateExpenseDto  
**Used by:** `PATCH /expenses/:id`

`PartialType(CreateExpenseDto)` — any subset of `CreateExpenseDto` fields. When a field is present, the same validations as in `CreateExpenseDto` apply.

---

### ExpenseQueryDto  
**Used by:** `GET /expenses`

| Field | Rules | Description |
|-------|-------|-------------|
| `startDate` | `@IsOptional()`, `@IsDateString()` | Include only expenses with `date >= startDate` |
| `endDate` | `@IsOptional()`, `@IsDateString()` | Include only expenses with `date <= endDate` |

**Example:** `GET /expenses?startDate=2025-01-01&endDate=2025-01-31`

---

### ExpenseByMonthQueryDto  
**Used by:** `GET /expenses/by-month`

| Field | Rules | Description |
|-------|-------|-------------|
| `year` | `@IsInt()`, `@Min(2000)`, `@Max(9999)`, `@Type(() => Number)` | Year (e.g. 2025) |
| `month` | `@IsInt()`, `@Min(1)`, `@Max(12)`, `@Type(() => Number)` | Month (1–12) |

**Example:** `GET /expenses/by-month?year=2025&month=1`

**Monthly report (by type and subtype):** See [REPORTING.md](REPORTING.md) for `GET /expenses/monthly-report` query, response DTOs, and examples.

---

## Response

All create/read/update endpoints return an `Expense` entity (or array for list endpoints) with:  
`id`, `amount`, `description`, `date`, `type`, `subtype`, `notes`, and timestamps.
