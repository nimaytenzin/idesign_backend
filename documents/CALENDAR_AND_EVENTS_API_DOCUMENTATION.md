# Calendar and Events API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [User Roles](#user-roles)
5. [Endpoints](#endpoints)
   - [Events](#events)
   - [Event Types](#event-types)
   - [Event Categories](#event-categories)
6. [Data Models](#data-models)
7. [Calendar Views](#calendar-views)
8. [Error Responses](#error-responses)
9. [Examples](#examples)

---

## Overview

The Calendar and Events API provides endpoints for managing events, event types, and event categories. This API allows authenticated users (staff and admin) to create, view, update, and delete events, as well as manage custom event types and categories for organizing events.

### Key Features
- Create, read, update, and delete events
- Support for custom event types (e.g., Meeting, Appointment, Task, Reminder)
- Support for custom event categories (e.g., Work, Personal, Urgent)
- Calendar views: Day, Week, and Month
- Event filtering by type, category, and date range
- All-day event support
- Event location tracking
- Created by user tracking
- All endpoints require JWT authentication

---

## Base URL

```
/api/events
```

All endpoints are prefixed with `/events`.

---

## Authentication

All endpoints in this API require:
1. **JWT Authentication** - Valid JWT token must be provided in the Authorization header
2. **Authenticated Users** - Both `STAFF` and `ADMIN` roles can access all endpoints

**Authorization Header Format:**
```
Authorization: Bearer <your_jwt_token>
```

---

## User Roles

The system supports two user roles, both with full access to calendar features:

- **ADMIN** - Full access to all calendar features
- **STAFF** - Full access to all calendar features

---

## Endpoints

### Events

#### 1. Create Event

Create a new event in the calendar.

**Endpoint:** `POST /events`

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Team Meeting",
  "description": "Quarterly planning session",
  "startDate": "2024-03-15T10:00:00Z",
  "endDate": "2024-03-15T11:30:00Z",
  "location": "Conference Room A",
  "eventTypeId": 1,
  "eventCategoryId": 2,
  "isAllDay": false
}
```

**Request Body Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Event title |
| `description` | string | No | Event description |
| `startDate` | ISO 8601 datetime | Yes | Event start date and time |
| `endDate` | ISO 8601 datetime | Yes | Event end date and time (must be after startDate) |
| `location` | string | No | Event location |
| `eventTypeId` | number | Yes | ID of the event type |
| `eventCategoryId` | number | No | ID of the event category (optional) |
| `isAllDay` | boolean | No | Whether the event is an all-day event (default: false) |

**Success Response:** `201 Created`
```json
{
  "id": 1,
  "title": "Team Meeting",
  "description": "Quarterly planning session",
  "startDate": "2024-03-15T10:00:00.000Z",
  "endDate": "2024-03-15T11:30:00.000Z",
  "location": "Conference Room A",
  "eventTypeId": 1,
  "eventCategoryId": 2,
  "createdById": 5,
  "isAllDay": false,
  "createdAt": "2024-03-10T08:00:00.000Z",
  "updatedAt": "2024-03-10T08:00:00.000Z",
  "eventType": {
    "id": 1,
    "name": "Meeting",
    "description": "Scheduled meetings",
    "color": "#3498db"
  },
  "eventCategory": {
    "id": 2,
    "name": "Work",
    "description": "Work-related events",
    "color": "#2ecc71"
  },
  "createdBy": {
    "id": 5,
    "name": "John Doe",
    "emailAddress": "john.doe@example.com"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input (e.g., endDate before startDate, invalid eventTypeId)
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Event type or category not found

---

#### 2. Get All Events

Retrieve all events with optional filtering.

**Endpoint:** `GET /events`

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `view` | string | No | Calendar view type: `day`, `week`, `month`, `list` |
| `startDate` | ISO 8601 date | No | Filter events starting from this date |
| `endDate` | ISO 8601 date | No | Filter events ending before this date |
| `eventTypeId` | number | No | Filter by event type ID |
| `eventCategoryId` | number | No | Filter by event category ID |

**Example Request:**
```
GET /events?startDate=2024-03-01&endDate=2024-03-31&eventTypeId=1
```

**Success Response:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Team Meeting",
    "description": "Quarterly planning session",
    "startDate": "2024-03-15T10:00:00.000Z",
    "endDate": "2024-03-15T11:30:00.000Z",
    "location": "Conference Room A",
    "eventTypeId": 1,
    "eventCategoryId": 2,
    "createdById": 5,
    "isAllDay": false,
    "createdAt": "2024-03-10T08:00:00.000Z",
    "updatedAt": "2024-03-10T08:00:00.000Z",
    "eventType": {
      "id": 1,
      "name": "Meeting",
      "description": "Scheduled meetings",
      "color": "#3498db"
    },
    "eventCategory": {
      "id": 2,
      "name": "Work",
      "description": "Work-related events",
      "color": "#2ecc71"
    },
    "createdBy": {
      "id": 5,
      "name": "John Doe",
      "emailAddress": "john.doe@example.com"
    }
  }
]
```

---

#### 3. Get Event by ID

Retrieve a specific event by its ID.

**Endpoint:** `GET /events/:id`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Event ID |

**Example Request:**
```
GET /events/1
```

**Success Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Team Meeting",
  "description": "Quarterly planning session",
  "startDate": "2024-03-15T10:00:00.000Z",
  "endDate": "2024-03-15T11:30:00.000Z",
  "location": "Conference Room A",
  "eventTypeId": 1,
  "eventCategoryId": 2,
  "createdById": 5,
  "isAllDay": false,
  "createdAt": "2024-03-10T08:00:00.000Z",
  "updatedAt": "2024-03-10T08:00:00.000Z",
  "eventType": {
    "id": 1,
    "name": "Meeting",
    "description": "Scheduled meetings",
    "color": "#3498db"
  },
  "eventCategory": {
    "id": 2,
    "name": "Work",
    "description": "Work-related events",
    "color": "#2ecc71"
  },
  "createdBy": {
    "id": 5,
    "name": "John Doe",
    "emailAddress": "john.doe@example.com"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Event not found

---

#### 4. Update Event

Update an existing event.

**Endpoint:** `PATCH /events/:id`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Event ID |

**Request Body:** (All fields are optional)
```json
{
  "title": "Updated Team Meeting",
  "description": "Updated description",
  "startDate": "2024-03-15T11:00:00Z",
  "endDate": "2024-03-15T12:30:00Z",
  "location": "Conference Room B",
  "eventTypeId": 1,
  "eventCategoryId": 3,
  "isAllDay": false
}
```

**Success Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Updated Team Meeting",
  "description": "Updated description",
  "startDate": "2024-03-15T11:00:00.000Z",
  "endDate": "2024-03-15T12:30:00.000Z",
  "location": "Conference Room B",
  "eventTypeId": 1,
  "eventCategoryId": 3,
  "createdById": 5,
  "isAllDay": false,
  "createdAt": "2024-03-10T08:00:00.000Z",
  "updatedAt": "2024-03-10T09:30:00.000Z",
  "eventType": {
    "id": 1,
    "name": "Meeting",
    "description": "Scheduled meetings",
    "color": "#3498db"
  },
  "eventCategory": {
    "id": 3,
    "name": "Important",
    "description": "Important events",
    "color": "#e74c3c"
  },
  "createdBy": {
    "id": 5,
    "name": "John Doe",
    "emailAddress": "john.doe@example.com"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input (e.g., endDate before startDate)
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Event, event type, or category not found

---

#### 5. Delete Event

Delete an event.

**Endpoint:** `DELETE /events/:id`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Event ID |

**Example Request:**
```
DELETE /events/1
```

**Success Response:** `204 No Content`

**Error Responses:**
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Event not found

---

### Calendar Views

#### 6. Get Day View

Retrieve all events for a specific day.

**Endpoint:** `GET /events/calendar/day/:date`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | ISO 8601 date | Yes | Date to retrieve events for (format: YYYY-MM-DD) |

**Example Request:**
```
GET /events/calendar/day/2024-03-15
```

**Success Response:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Team Meeting",
    "startDate": "2024-03-15T10:00:00.000Z",
    "endDate": "2024-03-15T11:30:00.000Z",
    ...
  },
  {
    "id": 2,
    "title": "Client Call",
    "startDate": "2024-03-15T14:00:00.000Z",
    "endDate": "2024-03-15T15:00:00.000Z",
    ...
  }
]
```

The day view includes:
- Events that start on the specified day
- Events that end on the specified day
- Events that span across the specified day

---

#### 7. Get Week View

Retrieve all events for a week starting from the specified date.

**Endpoint:** `GET /events/calendar/week/:startDate`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | ISO 8601 date | Yes | Start date of the week (format: YYYY-MM-DD) |

**Example Request:**
```
GET /events/calendar/week/2024-03-11
```

This returns events for the 7-day period starting from March 11, 2024 (March 11-17, 2024).

**Success Response:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Team Meeting",
    "startDate": "2024-03-15T10:00:00.000Z",
    "endDate": "2024-03-15T11:30:00.000Z",
    ...
  }
]
```

The week view includes:
- Events that start during the week
- Events that end during the week
- Events that span across the week

---

#### 8. Get Month View

Retrieve all events for a specific month.

**Endpoint:** `GET /events/calendar/month/:year/:month`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `year` | number | Yes | Year (e.g., 2024) |
| `month` | number | Yes | Month (1-12, where 1 = January, 12 = December) |

**Example Request:**
```
GET /events/calendar/month/2024/3
```

This returns events for March 2024.

**Success Response:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Team Meeting",
    "startDate": "2024-03-15T10:00:00.000Z",
    "endDate": "2024-03-15T11:30:00.000Z",
    ...
  }
]
```

The month view includes:
- Events that start during the month
- Events that end during the month
- Events that span across the month

---

### Event Types

Event types allow you to categorize events (e.g., Meeting, Appointment, Task, Reminder).

#### 9. Create Event Type

Create a new event type.

**Endpoint:** `POST /events/event-types`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Meeting",
  "description": "Scheduled meetings and conferences",
  "color": "#3498db"
}
```

**Request Body Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Event type name (must be unique) |
| `description` | string | No | Event type description |
| `color` | string | No | Color code for UI display (hex format, e.g., #3498db) |

**Success Response:** `201 Created`
```json
{
  "id": 1,
  "name": "Meeting",
  "description": "Scheduled meetings and conferences",
  "color": "#3498db",
  "createdAt": "2024-03-10T08:00:00.000Z",
  "updatedAt": "2024-03-10T08:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Event type name already exists
- `401 Unauthorized` - Missing or invalid JWT token

---

#### 10. Get All Event Types

Retrieve all event types.

**Endpoint:** `GET /events/event-types`

**Authentication:** Required

**Success Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Meeting",
    "description": "Scheduled meetings and conferences",
    "color": "#3498db",
    "createdAt": "2024-03-10T08:00:00.000Z",
    "updatedAt": "2024-03-10T08:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Appointment",
    "description": "Client appointments",
    "color": "#2ecc71",
    "createdAt": "2024-03-10T08:00:00.000Z",
    "updatedAt": "2024-03-10T08:00:00.000Z"
  }
]
```

---

#### 11. Update Event Type

Update an existing event type.

**Endpoint:** `PATCH /events/event-types/:id`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Event type ID |

**Request Body:** (All fields are optional)
```json
{
  "name": "Team Meeting",
  "description": "Updated description",
  "color": "#2980b9"
}
```

**Success Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Team Meeting",
  "description": "Updated description",
  "color": "#2980b9",
  "createdAt": "2024-03-10T08:00:00.000Z",
  "updatedAt": "2024-03-10T09:30:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Event type name already exists
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Event type not found

---

#### 12. Delete Event Type

Delete an event type.

**Endpoint:** `DELETE /events/event-types/:id`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Event type ID |

**Success Response:** `204 No Content`

**Error Responses:**
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Event type not found

**Note:** Deleting an event type that is referenced by events may cause issues. Consider updating or removing related events first.

---

### Event Categories

Event categories allow you to further organize events (e.g., Work, Personal, Urgent).

#### 13. Create Event Category

Create a new event category.

**Endpoint:** `POST /events/event-categories`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Work",
  "description": "Work-related events",
  "color": "#2ecc71"
}
```

**Request Body Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Event category name (must be unique) |
| `description` | string | No | Event category description |
| `color` | string | No | Color code for UI display (hex format, e.g., #2ecc71) |

**Success Response:** `201 Created`
```json
{
  "id": 1,
  "name": "Work",
  "description": "Work-related events",
  "color": "#2ecc71",
  "createdAt": "2024-03-10T08:00:00.000Z",
  "updatedAt": "2024-03-10T08:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Event category name already exists
- `401 Unauthorized` - Missing or invalid JWT token

---

#### 14. Get All Event Categories

Retrieve all event categories.

**Endpoint:** `GET /events/event-categories`

**Authentication:** Required

**Success Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Work",
    "description": "Work-related events",
    "color": "#2ecc71",
    "createdAt": "2024-03-10T08:00:00.000Z",
    "updatedAt": "2024-03-10T08:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Personal",
    "description": "Personal events",
    "color": "#9b59b6",
    "createdAt": "2024-03-10T08:00:00.000Z",
    "updatedAt": "2024-03-10T08:00:00.000Z"
  }
]
```

---

#### 15. Update Event Category

Update an existing event category.

**Endpoint:** `PATCH /events/event-categories/:id`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Event category ID |

**Request Body:** (All fields are optional)
```json
{
  "name": "Business",
  "description": "Business-related events",
  "color": "#27ae60"
}
```

**Success Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Business",
  "description": "Business-related events",
  "color": "#27ae60",
  "createdAt": "2024-03-10T08:00:00.000Z",
  "updatedAt": "2024-03-10T09:30:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Event category name already exists
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Event category not found

---

#### 16. Delete Event Category

Delete an event category.

**Endpoint:** `DELETE /events/event-categories/:id`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Event category ID |

**Success Response:** `204 No Content`

**Error Responses:**
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Event category not found

**Note:** Deleting an event category that is referenced by events will set the `eventCategoryId` to `null` for those events.

---

## Data Models

### Event Model

```typescript
{
  id: number;                    // Auto-generated unique ID
  title: string;                 // Event title (required)
  description: string | null;    // Event description (optional)
  startDate: Date;               // Event start date and time (required)
  endDate: Date;                 // Event end date and time (required)
  location: string | null;       // Event location (optional)
  eventTypeId: number;           // Reference to event type (required)
  eventCategoryId: number | null; // Reference to event category (optional)
  createdById: number;           // ID of user who created the event (required)
  isAllDay: boolean;             // Whether event is all-day (default: false)
  createdAt: Date;               // Auto-generated creation timestamp
  updatedAt: Date;               // Auto-generated update timestamp
  eventType?: EventType;         // Populated event type object
  eventCategory?: EventCategory; // Populated event category object
  createdBy?: User;              // Populated user object
}
```

### EventType Model

```typescript
{
  id: number;                    // Auto-generated unique ID
  name: string;                  // Event type name (required, unique)
  description: string | null;    // Event type description (optional)
  color: string | null;          // Color code for UI (optional)
  createdAt: Date;               // Auto-generated creation timestamp
  updatedAt: Date;               // Auto-generated update timestamp
}
```

### EventCategory Model

```typescript
{
  id: number;                    // Auto-generated unique ID
  name: string;                  // Event category name (required, unique)
  description: string | null;    // Event category description (optional)
  color: string | null;          // Color code for UI (optional)
  createdAt: Date;               // Auto-generated creation timestamp
  updatedAt: Date;               // Auto-generated update timestamp
}
```

---

## Calendar Views

The API provides three calendar view endpoints to retrieve events for specific time periods:

### Day View
- **Endpoint:** `GET /events/calendar/day/:date`
- **Returns:** All events that occur on the specified date
- **Includes:** Events that start, end, or span across the day

### Week View
- **Endpoint:** `GET /events/calendar/week/:startDate`
- **Returns:** All events that occur during the 7-day period starting from `startDate`
- **Includes:** Events that start, end, or span across the week

### Month View
- **Endpoint:** `GET /events/calendar/month/:year/:month`
- **Returns:** All events that occur during the specified month
- **Includes:** Events that start, end, or span across the month

**Note:** All calendar views return events sorted by `startDate` in ascending order.

---

## Error Responses

### 400 Bad Request
Returned when the request body is invalid or validation fails.

```json
{
  "statusCode": 400,
  "message": "End date must be after start date",
  "error": "Bad Request"
}
```

### 401 Unauthorized
Returned when the JWT token is missing, invalid, or expired.

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 404 Not Found
Returned when a requested resource doesn't exist.

```json
{
  "statusCode": 404,
  "message": "Event with ID 999 not found",
  "error": "Not Found"
}
```

---

## Examples

### Example 1: Creating an Event with Event Type and Category

**Step 1:** Create an event type (if it doesn't exist)
```bash
POST /events/event-types
{
  "name": "Meeting",
  "description": "Scheduled meetings",
  "color": "#3498db"
}
```

**Step 2:** Create an event category (if it doesn't exist)
```bash
POST /events/event-categories
{
  "name": "Work",
  "description": "Work-related events",
  "color": "#2ecc71"
}
```

**Step 3:** Create the event
```bash
POST /events
{
  "title": "Team Standup",
  "description": "Daily team standup meeting",
  "startDate": "2024-03-15T09:00:00Z",
  "endDate": "2024-03-15T09:30:00Z",
  "location": "Zoom",
  "eventTypeId": 1,
  "eventCategoryId": 1,
  "isAllDay": false
}
```

### Example 2: Getting Events for a Month

```bash
GET /events/calendar/month/2024/3
```

This returns all events in March 2024.

### Example 3: Filtering Events by Type

```bash
GET /events?eventTypeId=1&startDate=2024-03-01&endDate=2024-03-31
```

This returns all events of type ID 1 (e.g., "Meeting") in March 2024.

### Example 4: Creating an All-Day Event

```bash
POST /events
{
  "title": "Public Holiday",
  "description": "National holiday",
  "startDate": "2024-03-17T00:00:00Z",
  "endDate": "2024-03-17T23:59:59Z",
  "eventTypeId": 2,
  "isAllDay": true
}
```

### Example 5: Updating Event Location

```bash
PATCH /events/1
{
  "location": "Conference Room B"
}
```

---

## Best Practices

1. **Event Types and Categories:** Create commonly used event types and categories first before creating events.

2. **Date Format:** Always use ISO 8601 format for dates and datetimes (e.g., `2024-03-15T10:00:00Z`).

3. **All-Day Events:** For all-day events, set `isAllDay` to `true` and use the full day range for `startDate` and `endDate`.

4. **Filtering:** Use query parameters on `GET /events` for filtering instead of fetching all events and filtering client-side.

5. **Calendar Views:** Use the dedicated calendar view endpoints (`/calendar/day`, `/calendar/week`, `/calendar/month`) instead of filtering by date range for better performance.

6. **Error Handling:** Always check for error responses and handle them appropriately in your application.

7. **Authentication:** Include the JWT token in the Authorization header for all requests.

---

## Notes

- Events are stored with UTC timestamps. Convert to local time on the client side as needed.
- The `createdById` field is automatically set to the authenticated user's ID when creating an event.
- Event types and categories can be reused across multiple events.
- Deleting an event type may cause issues if it's still referenced by events. Consider updating events first.
- Event categories are optional and can be set to `null` when deleting a category that's in use.

