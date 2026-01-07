# Todo Management API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [User Roles](#user-roles)
5. [Endpoints](#endpoints)
   - [Portfolios](#portfolios)
   - [Todos](#todos)
   - [Calendar Views](#calendar-views)
6. [Data Models](#data-models)
7. [Filtering and Querying](#filtering-and-querying)
8. [Error Responses](#error-responses)
9. [Examples](#examples)

---

## Overview

The Todo Management API provides endpoints for managing todos, portfolios, and task assignments. This API allows authenticated users to create, view, update, and delete todos organized by portfolios (e.g., Operations, Printing, Maintenance), assign tasks to one or more users, track task status, and view tasks by day or week.

### Key Features
- Create, read, update, and delete todos
- Portfolio-based organization (Operations, Printing, Maintenance, etc.)
- Multi-user task assignment (assign tasks to one or more users)
- Status tracking (PENDING, COMPLETED)
- Date-based views: Daily and Weekly (grouped by day)
- Advanced filtering: by staff, status, portfolio, and date range
- Assigned date tracking (defaults to current time, can be manually set)
- Due date tracking
- All endpoints require JWT authentication

---

## Base URL

```
/api/todos
```

All endpoints are prefixed with `/todos`.

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

The system supports two user roles, both with full access to todo features:

- **ADMIN** - Full access to all todo features
- **STAFF** - Full access to all todo features

---

## Endpoints

### Portfolios

Portfolios are used to categorize and organize todos (e.g., Operations, Printing, Maintenance).

#### 1. Create Portfolio

Create a new portfolio for organizing todos.

**Endpoint:** `POST /todos/portfolios`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Operations"
}
```

**Request Body Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Portfolio name (must be unique, minimum 1 character) |

**Success Response:** `201 Created`
```json
{
  "id": 1,
  "name": "Operations",
  "createdAt": "2024-03-10T08:00:00.000Z",
  "updatedAt": "2024-03-10T08:00:00.000Z",
  "todosCount": 0
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input (e.g., empty name)
- `401 Unauthorized` - Missing or invalid JWT token
- `409 Conflict` - Portfolio with the same name already exists

---

#### 2. Get All Portfolios

Retrieve all portfolios with their associated todos count.

**Endpoint:** `GET /todos/portfolios`

**Authentication:** Required

**Success Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Operations",
    "createdAt": "2024-03-10T08:00:00.000Z",
    "updatedAt": "2024-03-10T08:00:00.000Z",
    "todosCount": 5
  },
  {
    "id": 2,
    "name": "Printing",
    "createdAt": "2024-03-10T08:30:00.000Z",
    "updatedAt": "2024-03-10T08:30:00.000Z",
    "todosCount": 3
  },
  {
    "id": 3,
    "name": "Maintenance",
    "createdAt": "2024-03-10T09:00:00.000Z",
    "updatedAt": "2024-03-10T09:00:00.000Z",
    "todosCount": 2
  }
]
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid JWT token

---

#### 3. Get Portfolio by ID

Retrieve a specific portfolio by its ID.

**Endpoint:** `GET /todos/portfolios/:id`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Portfolio ID |

**Example Request:**
```
GET /todos/portfolios/1
```

**Success Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Operations",
  "createdAt": "2024-03-10T08:00:00.000Z",
  "updatedAt": "2024-03-10T08:00:00.000Z",
  "todosCount": 5
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Portfolio not found

---

#### 4. Update Portfolio

Update an existing portfolio.

**Endpoint:** `PATCH /todos/portfolios/:id`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Portfolio ID |

**Request Body:** (All fields are optional)
```json
{
  "name": "Updated Operations"
}
```

**Success Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Updated Operations",
  "createdAt": "2024-03-10T08:00:00.000Z",
  "updatedAt": "2024-03-10T09:30:00.000Z",
  "todosCount": 5
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Portfolio not found
- `409 Conflict` - Portfolio with the same name already exists

---

#### 5. Delete Portfolio

Delete a portfolio. Note: This will not delete associated todos, but todos will lose their portfolio association.

**Endpoint:** `DELETE /todos/portfolios/:id`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Portfolio ID |

**Success Response:** `204 No Content`

**Error Responses:**
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Portfolio not found

---

### Todos

#### 1. Create Todo

Create a new todo task.

**Endpoint:** `POST /todos`

**Authentication:** Required

**Request Body:**
```json
{
  "task": "Complete quarterly report",
  "description": "Prepare and submit Q1 financial report",
  "portfolioId": 1,
  "assignedUserIds": [2, 3, 5],
  "assignedDate": "2024-03-15T09:00:00Z",
  "dueBy": "2024-03-20T17:00:00Z",
  "status": "PENDING"
}
```

**Request Body Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `task` | string | Yes | Task title/name |
| `description` | string | No | Task description |
| `portfolioId` | number | Yes | Portfolio ID (must exist) |
| `assignedUserIds` | number[] | Yes | Array of user IDs to assign the task to (minimum 1 user) |
| `assignedDate` | ISO 8601 datetime | No | Assignment date (defaults to current time if not provided) |
| `dueBy` | ISO 8601 datetime | No | Due date |
| `status` | enum | No | Task status: `PENDING` (default) or `COMPLETED` |

**Success Response:** `201 Created`
```json
{
  "id": 1,
  "task": "Complete quarterly report",
  "description": "Prepare and submit Q1 financial report",
  "status": "PENDING",
  "assignedDate": "2024-03-15T09:00:00.000Z",
  "dueBy": "2024-03-20T17:00:00.000Z",
  "portfolioId": 1,
  "createdById": 1,
  "createdAt": "2024-03-10T08:00:00.000Z",
  "updatedAt": "2024-03-10T08:00:00.000Z",
  "portfolio": {
    "id": 1,
    "name": "Operations"
  },
  "createdBy": {
    "id": 1,
    "name": "John Doe",
    "emailAddress": "john.doe@example.com"
  },
  "assignedUsers": [
    {
      "id": 2,
      "name": "Jane Smith",
      "emailAddress": "jane.smith@example.com"
    },
    {
      "id": 3,
      "name": "Bob Johnson",
      "emailAddress": "bob.johnson@example.com"
    },
    {
      "id": 5,
      "name": "Alice Brown",
      "emailAddress": "alice.brown@example.com"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input (e.g., empty task, invalid user IDs)
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Portfolio or one or more assigned users not found

---

#### 2. Get All Todos

Retrieve all todos with optional filtering.

**Endpoint:** `GET /todos`

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `portfolioId` | number | No | Filter by portfolio ID |
| `status` | enum | No | Filter by status: `PENDING` or `COMPLETED` |
| `assignedUserId` | number | No | Filter by assigned user ID |
| `startDate` | ISO 8601 date | No | Start date for date range filter (must be used with `endDate`) |
| `endDate` | ISO 8601 date | No | End date for date range filter (must be used with `startDate`) |

**Example Requests:**
```
GET /todos
GET /todos?status=PENDING
GET /todos?portfolioId=1&status=COMPLETED
GET /todos?assignedUserId=2
GET /todos?startDate=2024-03-15&endDate=2024-03-20
GET /todos?portfolioId=1&status=PENDING&assignedUserId=2&startDate=2024-03-15&endDate=2024-03-20
```

**Success Response:** `200 OK`
```json
[
  {
    "id": 1,
    "task": "Complete quarterly report",
    "description": "Prepare and submit Q1 financial report",
    "status": "PENDING",
    "assignedDate": "2024-03-15T09:00:00.000Z",
    "dueBy": "2024-03-20T17:00:00.000Z",
    "portfolioId": 1,
    "createdById": 1,
    "createdAt": "2024-03-10T08:00:00.000Z",
    "updatedAt": "2024-03-10T08:00:00.000Z",
    "portfolio": {
      "id": 1,
      "name": "Operations"
    },
    "createdBy": {
      "id": 1,
      "name": "John Doe",
      "emailAddress": "john.doe@example.com"
    },
    "assignedUsers": [
      {
        "id": 2,
        "name": "Jane Smith",
        "emailAddress": "jane.smith@example.com"
      }
    ]
  }
]
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid JWT token

---

#### 3. Get Todo by ID

Retrieve a specific todo by its ID.

**Endpoint:** `GET /todos/:id`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Todo ID |

**Example Request:**
```
GET /todos/1
```

**Success Response:** `200 OK`
```json
{
  "id": 1,
  "task": "Complete quarterly report",
  "description": "Prepare and submit Q1 financial report",
  "status": "PENDING",
  "assignedDate": "2024-03-15T09:00:00.000Z",
  "dueBy": "2024-03-20T17:00:00.000Z",
  "portfolioId": 1,
  "createdById": 1,
  "createdAt": "2024-03-10T08:00:00.000Z",
  "updatedAt": "2024-03-10T08:00:00.000Z",
  "portfolio": {
    "id": 1,
    "name": "Operations"
  },
  "createdBy": {
    "id": 1,
    "name": "John Doe",
    "emailAddress": "john.doe@example.com"
  },
  "assignedUsers": [
    {
      "id": 2,
      "name": "Jane Smith",
      "emailAddress": "jane.smith@example.com"
    },
    {
      "id": 3,
      "name": "Bob Johnson",
      "emailAddress": "bob.johnson@example.com"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Todo not found

---

#### 4. Update Todo

Update an existing todo.

**Endpoint:** `PATCH /todos/:id`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Todo ID |

**Request Body:** (All fields are optional)
```json
{
  "task": "Updated task name",
  "description": "Updated description",
  "portfolioId": 2,
  "assignedUserIds": [2, 4],
  "assignedDate": "2024-03-16T09:00:00Z",
  "dueBy": "2024-03-25T17:00:00Z",
  "status": "COMPLETED"
}
```

**Request Body Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `task` | string | No | Task title/name |
| `description` | string | No | Task description |
| `portfolioId` | number | No | Portfolio ID (must exist if provided) |
| `assignedUserIds` | number[] | No | Array of user IDs (minimum 1 user if provided) |
| `assignedDate` | ISO 8601 datetime | No | Assignment date |
| `dueBy` | ISO 8601 datetime | No | Due date (can be null) |
| `status` | enum | No | Task status: `PENDING` or `COMPLETED` |

**Success Response:** `200 OK`
```json
{
  "id": 1,
  "task": "Updated task name",
  "description": "Updated description",
  "status": "COMPLETED",
  "assignedDate": "2024-03-16T09:00:00.000Z",
  "dueBy": "2024-03-25T17:00:00.000Z",
  "portfolioId": 2,
  "createdById": 1,
  "createdAt": "2024-03-10T08:00:00.000Z",
  "updatedAt": "2024-03-10T10:00:00.000Z",
  "portfolio": {
    "id": 2,
    "name": "Printing"
  },
  "createdBy": {
    "id": 1,
    "name": "John Doe",
    "emailAddress": "john.doe@example.com"
  },
  "assignedUsers": [
    {
      "id": 2,
      "name": "Jane Smith",
      "emailAddress": "jane.smith@example.com"
    },
    {
      "id": 4,
      "name": "Charlie Wilson",
      "emailAddress": "charlie.wilson@example.com"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Todo, portfolio, or one or more assigned users not found

---

#### 5. Delete Todo

Delete a todo.

**Endpoint:** `DELETE /todos/:id`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Todo ID |

**Success Response:** `204 No Content`

**Error Responses:**
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Todo not found

---

### Calendar Views

#### 1. Get Daily View

Retrieve all todos for a specific day. Returns todos where the assigned date or due date falls on the specified day.

**Endpoint:** `GET /todos/day/:date`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | ISO 8601 date | Yes | Date to view (format: YYYY-MM-DD) |

**Example Request:**
```
GET /todos/day/2024-03-15
```

**Success Response:** `200 OK`
```json
[
  {
    "id": 1,
    "task": "Complete quarterly report",
    "description": "Prepare and submit Q1 financial report",
    "status": "PENDING",
    "assignedDate": "2024-03-15T09:00:00.000Z",
    "dueBy": "2024-03-20T17:00:00.000Z",
    "portfolioId": 1,
    "createdById": 1,
    "createdAt": "2024-03-10T08:00:00.000Z",
    "updatedAt": "2024-03-10T08:00:00.000Z",
    "portfolio": {
      "id": 1,
      "name": "Operations"
    },
    "createdBy": {
      "id": 1,
      "name": "John Doe",
      "emailAddress": "john.doe@example.com"
    },
    "assignedUsers": [
      {
        "id": 2,
        "name": "Jane Smith",
        "emailAddress": "jane.smith@example.com"
      }
    ]
  },
  {
    "id": 2,
    "task": "Review printing schedule",
    "description": "Check and approve next week's printing schedule",
    "status": "PENDING",
    "assignedDate": "2024-03-14T10:00:00.000Z",
    "dueBy": "2024-03-15T17:00:00.000Z",
    "portfolioId": 2,
    "createdById": 1,
    "createdAt": "2024-03-10T09:00:00.000Z",
    "updatedAt": "2024-03-10T09:00:00.000Z",
    "portfolio": {
      "id": 2,
      "name": "Printing"
    },
    "createdBy": {
      "id": 1,
      "name": "John Doe",
      "emailAddress": "john.doe@example.com"
    },
    "assignedUsers": [
      {
        "id": 3,
        "name": "Bob Johnson",
        "emailAddress": "bob.johnson@example.com"
      }
    ]
  }
]
```

**Error Responses:**
- `400 Bad Request` - Invalid date format
- `401 Unauthorized` - Missing or invalid JWT token

---

#### 2. Get Weekly View

Retrieve all todos for a week starting from the specified date, grouped by day of the week.

**Endpoint:** `GET /todos/week/:startDate`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | ISO 8601 date | Yes | Start date of the week (format: YYYY-MM-DD) |

**Example Request:**
```
GET /todos/week/2024-03-15
```

**Success Response:** `200 OK`
```json
{
  "Monday": [
    {
      "id": 1,
      "task": "Complete quarterly report",
      "description": "Prepare and submit Q1 financial report",
      "status": "PENDING",
      "assignedDate": "2024-03-18T09:00:00.000Z",
      "dueBy": "2024-03-20T17:00:00.000Z",
      "portfolioId": 1,
      "createdById": 1,
      "createdAt": "2024-03-10T08:00:00.000Z",
      "updatedAt": "2024-03-10T08:00:00.000Z",
      "portfolio": {
        "id": 1,
        "name": "Operations"
      },
      "createdBy": {
        "id": 1,
        "name": "John Doe",
        "emailAddress": "john.doe@example.com"
      },
      "assignedUsers": [
        {
          "id": 2,
          "name": "Jane Smith",
          "emailAddress": "jane.smith@example.com"
        }
      ]
    }
  ],
  "Tuesday": [
    {
      "id": 2,
      "task": "Review printing schedule",
      "description": "Check and approve next week's printing schedule",
      "status": "PENDING",
      "assignedDate": "2024-03-19T10:00:00.000Z",
      "dueBy": "2024-03-22T17:00:00.000Z",
      "portfolioId": 2,
      "createdById": 1,
      "createdAt": "2024-03-10T09:00:00.000Z",
      "updatedAt": "2024-03-10T09:00:00.000Z",
      "portfolio": {
        "id": 2,
        "name": "Printing"
      },
      "createdBy": {
        "id": 1,
        "name": "John Doe",
        "emailAddress": "john.doe@example.com"
      },
      "assignedUsers": [
        {
          "id": 3,
          "name": "Bob Johnson",
          "emailAddress": "bob.johnson@example.com"
        }
      ]
    }
  ],
  "Wednesday": [],
  "Thursday": [],
  "Friday": [],
  "Saturday": [],
  "Sunday": []
}
```

**Note:** The response includes all days of the week (Monday through Sunday), with empty arrays for days that have no todos.

**Error Responses:**
- `400 Bad Request` - Invalid date format
- `401 Unauthorized` - Missing or invalid JWT token

---

## Data Models

### Portfolio

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Unique portfolio identifier (auto-generated) |
| `name` | string | Portfolio name (unique) |
| `createdAt` | ISO 8601 datetime | Creation timestamp |
| `updatedAt` | ISO 8601 datetime | Last update timestamp |

### Todo

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Unique todo identifier (auto-generated) |
| `task` | string | Task title/name |
| `description` | string \| null | Task description |
| `status` | enum | Task status: `PENDING` or `COMPLETED` (default: `PENDING`) |
| `assignedDate` | ISO 8601 datetime | Date when task was assigned (defaults to current time if not provided) |
| `dueBy` | ISO 8601 datetime \| null | Due date for the task |
| `portfolioId` | number | Reference to portfolio |
| `createdById` | number | Reference to user who created the todo |
| `createdAt` | ISO 8601 datetime | Creation timestamp |
| `updatedAt` | ISO 8601 datetime | Last update timestamp |

### Todo Response (with relations)

The todo response includes related data:

- `portfolio`: Portfolio object with `id` and `name`
- `createdBy`: User object with `id`, `name`, and `emailAddress`
- `assignedUsers`: Array of user objects with `id`, `name`, and `emailAddress`

### Status Enum

- `PENDING` - Task is pending/not completed (default)
- `COMPLETED` - Task is completed

---

## Filtering and Querying

### Available Filters

The `GET /todos` endpoint supports multiple query parameters for filtering:

1. **By Portfolio**: `?portfolioId=1`
2. **By Status**: `?status=PENDING` or `?status=COMPLETED`
3. **By Assigned User**: `?assignedUserId=2`
4. **By Date Range**: `?startDate=2024-03-15&endDate=2024-03-20`

### Combining Filters

You can combine multiple filters:

```
GET /todos?portfolioId=1&status=PENDING&assignedUserId=2&startDate=2024-03-15&endDate=2024-03-20
```

This will return todos that:
- Belong to portfolio ID 1
- Have status PENDING
- Are assigned to user ID 2
- Have assigned date or due date within the specified date range

### Date Range Filtering

When using `startDate` and `endDate`:
- Both parameters must be provided together
- The filter matches todos where either `assignedDate` or `dueBy` falls within the range
- Date format: `YYYY-MM-DD` (e.g., `2024-03-15`)

---

## Error Responses

### Standard Error Format

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message description",
  "error": "Error type"
}
```

### Common Error Codes

| Status Code | Description |
|------------|-------------|
| `400 Bad Request` | Invalid input data or request format |
| `401 Unauthorized` | Missing or invalid JWT token |
| `404 Not Found` | Resource not found (portfolio, todo, user) |
| `409 Conflict` | Resource conflict (e.g., duplicate portfolio name) |

### Example Error Responses

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "assignedUserIds must contain at least 1 element",
  "error": "Bad Request"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Portfolio with ID 999 not found",
  "error": "Not Found"
}
```

**409 Conflict:**
```json
{
  "statusCode": 409,
  "message": "Portfolio with name \"Operations\" already exists",
  "error": "Conflict"
}
```

---

## Examples

### Example 1: Complete Todo Workflow

#### Step 1: Create a Portfolio
```bash
POST /todos/portfolios
{
  "name": "Operations"
}
```

#### Step 2: Create a Todo
```bash
POST /todos
{
  "task": "Complete quarterly report",
  "description": "Prepare and submit Q1 financial report",
  "portfolioId": 1,
  "assignedUserIds": [2, 3],
  "assignedDate": "2024-03-15T09:00:00Z",
  "dueBy": "2024-03-20T17:00:00Z",
  "status": "PENDING"
}
```

#### Step 3: View Todos for a Day
```bash
GET /todos/day/2024-03-15
```

#### Step 4: Update Todo Status
```bash
PATCH /todos/1
{
  "status": "COMPLETED"
}
```

#### Step 5: View Weekly Todos
```bash
GET /todos/week/2024-03-15
```

---

### Example 2: Filtering Todos

#### Get All Pending Todos for a Specific User
```bash
GET /todos?status=PENDING&assignedUserId=2
```

#### Get All Completed Todos in Operations Portfolio
```bash
GET /todos?portfolioId=1&status=COMPLETED
```

#### Get Todos for a Date Range
```bash
GET /todos?startDate=2024-03-15&endDate=2024-03-20
```

#### Get Pending Todos for a User in Operations Portfolio for a Specific Week
```bash
GET /todos?portfolioId=1&status=PENDING&assignedUserId=2&startDate=2024-03-15&endDate=2024-03-21
```

---

### Example 3: Managing Multiple Assignees

#### Create Todo with Multiple Assignees
```bash
POST /todos
{
  "task": "Team project review",
  "description": "Review and approve team project deliverables",
  "portfolioId": 1,
  "assignedUserIds": [2, 3, 5, 7],
  "assignedDate": "2024-03-15T09:00:00Z",
  "dueBy": "2024-03-22T17:00:00Z"
}
```

#### Update Assignees
```bash
PATCH /todos/1
{
  "assignedUserIds": [2, 4, 6]
}
```

---

### Example 4: Using Assigned Date

#### Create Todo with Default Assigned Date (Current Time)
```bash
POST /todos
{
  "task": "New task",
  "portfolioId": 1,
  "assignedUserIds": [2]
  // assignedDate will default to current time
}
```

#### Create Todo with Past Assigned Date
```bash
POST /todos
{
  "task": "Backdated task",
  "portfolioId": 1,
  "assignedUserIds": [2],
  "assignedDate": "2024-03-10T09:00:00Z"  // Past date
}
```

---

## Notes

1. **Assigned Date**: If not provided when creating a todo, it defaults to the current time. However, you can manually set it to any date, including past dates.

2. **Multi-User Assignment**: Todos can be assigned to multiple users. When filtering by `assignedUserId`, only todos assigned to that specific user will be returned.

3. **Weekly View Grouping**: The weekly view groups todos by day of the week (Monday through Sunday). Days with no todos will have empty arrays.

4. **Date Filtering**: When filtering by date range, the system checks both `assignedDate` and `dueBy` fields. A todo will be included if either date falls within the range.

5. **Portfolio Deletion**: Deleting a portfolio does not delete associated todos, but todos will lose their portfolio association. Consider updating todos before deleting a portfolio.

6. **Status Updates**: You can update a todo's status at any time. Use `PATCH /todos/:id` with the `status` field.

---

## Support

For issues or questions regarding the Todo Management API, please contact the development team.

