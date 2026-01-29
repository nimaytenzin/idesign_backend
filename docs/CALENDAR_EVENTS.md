# Calendar Events – Creating Events

Documentation for creating calendar events: single events and recurring events (weekly, monthly, annually).

**Base path:** `/calendar-events`  
**Authentication:** All routes require JWT (`JwtAuthGuard`).

---

## Routes overview

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/calendar-events` | Create a single event |
| `POST` | `/calendar-events/recurring` | Create recurring events (one event per occurrence in date range) |
| `GET` | `/calendar-events/this-month` | List events in the current month (UTC); any event overlapping the month is included |

---

## 1. Create a single event

**Route:** `POST /calendar-events`  
**Response:** `201 Created` — one `CalendarEventResponseDto`.

### Request body: `CreateCalendarEventDto`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Event title |
| `start` | string | Yes | Start date-time (ISO 8601, e.g. `2025-01-15T17:00:00.000Z`) |
| `end` | string | No | End date-time (ISO 8601). For all-day events, defaults to end of start day |
| `allDay` | boolean | No | Default `false`. If true, end is set to end of day when omitted |
| `backgroundColor` | string | No | CSS color |
| `borderColor` | string | No | CSS color |
| `textColor` | string | No | CSS color |
| `location` | string | No | Location text |
| `description` | string | No | Description text |

### Example – timed event

```json
{
  "title": "Team meeting",
  "start": "2025-01-15T14:00:00.000Z",
  "end": "2025-01-15T15:00:00.000Z",
  "location": "Room 101",
  "description": "Sprint planning"
}
```

### Example – all-day event

```json
{
  "title": "Company holiday",
  "start": "2025-01-01T00:00:00.000Z",
  "allDay": true,
  "backgroundColor": "#ffeb3b"
}
```

---

## 2. Create recurring events

**Route:** `POST /calendar-events/recurring`  
**Response:** `201 Created` — array of `CalendarEventResponseDto` (one per occurrence).

Generates one calendar event per occurrence between `startFrom` and `endAt` according to the recurrence rule. All occurrences use the same title, colors, location, and description.

### Request body: `CreateRecurringCalendarEventDto`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Event title (same for all occurrences) |
| `recurrenceType` | enum | Yes | `WEEKLY` \| `MONTHLY` \| `ANNUALLY` |
| `time` | string | Yes | Time of day: `HH:mm` or `HH:mm:ss` (e.g. `"17:00"` for 5pm) |
| `startFrom` | string | Yes | First date for occurrences: `YYYY-MM-DD` |
| `endAt` | string | Yes | Last date for occurrences: `YYYY-MM-DD` |
| `dayOfWeek` | number 1–7 | If WEEKLY | 1 = Monday, 7 = Sunday |
| `dayOfMonth` | number 1–31 | If MONTHLY or ANNUALLY | Day of month |
| `month` | number 1–12 | If ANNUALLY | Month (1 = January) |
| `durationMinutes` | number | No | Duration for timed events. Default `60`. Max 1440 |
| `allDay` | boolean | No | Default `false` |
| `backgroundColor` | string | No | Same as single event |
| `borderColor` | string | No | Same as single event |
| `textColor` | string | No | Same as single event |
| `location` | string | No | Same as single event |
| `description` | string | No | Same as single event |

### Recurrence types

- **WEEKLY** — Same day of week every week (e.g. every Monday 5pm). Requires `dayOfWeek` (1=Monday … 7=Sunday).
- **MONTHLY** — Same day of month every month (e.g. 25th of every month). Requires `dayOfMonth` (1–31). If the month has fewer days (e.g. Feb 30), the last day of that month is used.
- **ANNUALLY** — Same date every year (e.g. Jan 25 every year). Requires `month` (1–12) and `dayOfMonth` (1–31).

### Example – every Monday 5pm (WEEKLY)

```json
{
  "title": "Weekly standup",
  "recurrenceType": "WEEKLY",
  "dayOfWeek": 1,
  "time": "17:00",
  "startFrom": "2025-01-01",
  "endAt": "2025-12-31",
  "durationMinutes": 60,
  "location": "Main room"
}
```

### Example – 25th of every month (MONTHLY)

```json
{
  "title": "Monthly review",
  "recurrenceType": "MONTHLY",
  "dayOfMonth": 25,
  "time": "10:00",
  "startFrom": "2025-01-01",
  "endAt": "2026-12-31",
  "durationMinutes": 90
}
```

### Example – Jan 25 every year (ANNUALLY)

```json
{
  "title": "Company anniversary",
  "recurrenceType": "ANNUALLY",
  "month": 1,
  "dayOfMonth": 25,
  "time": "14:00",
  "startFrom": "2025-01-01",
  "endAt": "2030-12-31",
  "allDay": false,
  "durationMinutes": 120
}
```

### Validation notes

- `startFrom` must be on or before `endAt`. If no occurrence falls in the range, the API returns `400 Bad Request`.
- Date/time math for recurring events is done in UTC.
- For WEEKLY, the first occurrence is the first matching weekday on or after `startFrom`; then every 7 days until `endAt`.

---

## Events in this month

**Route:** `GET /calendar-events/this-month`  
**Response:** Array of `CalendarEventResponseDto`.

Returns all events that overlap the **current month** (server UTC). Events that start in the month, end in the month, or span the whole month are included. Ordered by `start` ascending.

No query parameters. The month is derived from the server’s current UTC date.

---

## Response shape

Create endpoints and `GET /calendar-events/this-month` return event(s) in `CalendarEventResponseDto` form:

- `id`, `title`, `start`, `end`, `allDay`
- `backgroundColor`, `borderColor`, `textColor`
- `extendedProps` (e.g. `location`, `description` when present)
- `createdById`, `createdBy` (user snapshot), `createdAt`, `updatedAt`

Single create returns one object; recurring create returns an array of such objects.
