# Employee Management API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [User Roles](#user-roles)
5. [Endpoints](#endpoints)
6. [Data Models](#data-models)
7. [Error Responses](#error-responses)
8. [Examples](#examples)

---

## Overview

The Employee Management API provides endpoints for managing staff members in the system. This API allows administrators to create, view, update, reset passwords, and delete staff accounts.

### Key Features
- Create new staff members with secure password hashing
- View all staff members or individual staff details
- Update staff information (name, email, department, position, profile image, etc.)
- Manage staff education qualifications
- Manage staff employment/work experience history
- Reset staff passwords (admin-only operation)
- Delete staff members
- All endpoints are protected and require ADMIN role

---

## Base URL

```
/api/employee-management
```

All endpoints are prefixed with `/employee-management`.

---

## Authentication

All endpoints in this API require:
1. **JWT Authentication** - Valid JWT token must be provided in the Authorization header
2. **Admin Role** - Only users with `ADMIN` role can access these endpoints

**Authorization Header Format:**
```
Authorization: Bearer <your_jwt_token>
```

---

## User Roles

The system supports two user roles:

- **ADMIN** - Full access to all system features including employee management
- **STAFF** - Limited access, cannot manage other employees

---

## Endpoints

### 1. Create Staff Member

Create a new staff member account in the system.

**Endpoint:** `POST /employee-management/staff`

**Authentication:** Required (ADMIN only)

**Request Body:**
```json
{
  "name": "Tenzin Wangmo",
  "cid": "11901012345",
  "emailAddress": "tenzin.wangmo@example.com",
  "phoneNumber": "+975-17123456",
  "password": "securePassword123",
  "department": "Sales",
  "position": "Sales Representative",
  "address": "123 Main Street, Thimphu, Bhutan",
  "dateOfBirth": "1990-05-15",
  "hireDate": "2024-01-15",
  "profileImageUrl": "https://example.com/uploads/profiles/tenzin-wangmo.jpg"
}
```

**Request Body Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Staff member's full name |
| `cid` | string | Yes | Unique Citizen ID (must be unique across all users) |
| `emailAddress` | string | Yes | Staff member's email address (must be valid email format and unique) |
| `password` | string | Yes | Password (minimum 6 characters) |
| `phoneNumber` | string | No | Staff member's phone number |
| `department` | string | No | Department name |
| `position` | string | No | Job position/title |
| `address` | string | No | Physical address |
| `dateOfBirth` | date | No | Date of birth (ISO format: YYYY-MM-DD) |
| `hireDate` | date | No | Hire date (ISO format: YYYY-MM-DD) |
| `profileImageUrl` | string | No | URL or path to staff member's profile image |

**Response:** `201 Created`
```json
{
  "id": 1,
  "name": "Tenzin Wangmo",
  "cid": "11901012345",
  "emailAddress": "tenzin.wangmo@example.com",
  "phoneNumber": "+975-17123456",
  "role": "STAFF",
  "department": "Sales",
  "position": "Sales Representative",
  "address": "123 Main Street, Thimphu, Bhutan",
  "dateOfBirth": "1990-05-15T00:00:00.000Z",
  "hireDate": "2024-01-15T00:00:00.000Z",
  "employeeStatus": "ACTIVE",
  "employeeId": null,
  "terminationDate": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Note:** Password is never returned in the response for security reasons.

**Error Responses:**
- `400 Bad Request` - Validation errors
  ```json
  {
    "statusCode": 400,
    "message": ["password must be longer than or equal to 6 characters"],
    "error": "Bad Request"
  }
  ```

- `409 Conflict` - CID or email already exists
  ```json
  {
    "statusCode": 409,
    "message": "User with this CID already exists",
    "error": "Conflict"
  }
  ```

- `401 Unauthorized` - Invalid or missing JWT token
  ```json
  {
    "statusCode": 401,
    "message": "Unauthorized"
  }
  ```

- `403 Forbidden` - User does not have ADMIN role
  ```json
  {
    "statusCode": 403,
    "message": "Forbidden resource"
  }
  ```

---

### 2. Get All Staff Members

Retrieve a list of all staff members in the system.

**Endpoint:** `GET /employee-management/staff`

**Authentication:** Required (ADMIN only)

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Tenzin Wangmo",
    "cid": "11901012345",
    "emailAddress": "tenzin.wangmo@example.com",
    "phoneNumber": "+975-17123456",
    "role": "STAFF",
    "department": "Sales",
    "position": "Sales Representative",
    "address": "123 Main Street, Thimphu, Bhutan",
    "dateOfBirth": "1990-05-15T00:00:00.000Z",
    "hireDate": "2024-01-15T00:00:00.000Z",
    "employeeStatus": "ACTIVE",
    "employeeId": null,
    "terminationDate": null,
    "profileImageUrl": "https://example.com/uploads/profiles/tenzin-wangmo.jpg",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": 2,
    "name": "Dorji Lhamo",
    "cid": "11901012346",
    "emailAddress": "dorji.lhamo@example.com",
    "phoneNumber": "+975-17123457",
    "role": "STAFF",
    "department": "Customer Service",
    "position": "Customer Service Representative",
    "address": "456 Main Street, Thimphu, Bhutan",
    "dateOfBirth": "1992-08-20T00:00:00.000Z",
    "hireDate": "2024-02-01T00:00:00.000Z",
    "employeeStatus": "ACTIVE",
    "employeeId": null,
    "terminationDate": null,
    "profileImageUrl": "https://example.com/uploads/profiles/dorji-lhamo.jpg",
    "createdAt": "2024-02-01T10:30:00.000Z",
    "updatedAt": "2024-02-01T10:30:00.000Z"
  }
]
```

**Note:** Results are sorted alphabetically by name. Only users with `STAFF` role are returned. Passwords are never included in the response. Results are ordered by start date (most recent first) for education and effective date (most recent first) for work experience.

---

### 3. Get Staff Member by ID

Retrieve detailed information about a specific staff member.

**Endpoint:** `GET /employee-management/staff/:id`

**Authentication:** Required (ADMIN only)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Staff member's unique identifier |

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Tenzin Wangmo",
  "cid": "11901012345",
  "emailAddress": "tenzin.wangmo@example.com",
  "phoneNumber": "+975-17123456",
  "role": "STAFF",
  "department": "Sales",
  "position": "Sales Representative",
  "address": "123 Main Street, Thimphu, Bhutan",
  "dateOfBirth": "1990-05-15T00:00:00.000Z",
  "hireDate": "2024-01-15T00:00:00.000Z",
  "employeeStatus": "ACTIVE",
  "employeeId": null,
  "terminationDate": null,
  "profileImageUrl": "https://example.com/uploads/profiles/tenzin-wangmo.jpg",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Staff member not found
  ```json
  {
    "statusCode": 404,
    "message": "Staff member not found",
    "error": "Not Found"
  }
  ```

---

### 4. Update Staff Member

Update information for an existing staff member.

**Endpoint:** `PATCH /employee-management/staff/:id`

**Authentication:** Required (ADMIN only)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Staff member's unique identifier |

**Request Body:**
```json
{
  "name": "Tenzin Wangmo Updated",
  "department": "Marketing",
  "position": "Marketing Manager",
  "phoneNumber": "+975-17987654",
  "employeeStatus": "ACTIVE"
}
```

**Request Body Schema:**
All fields are optional. Password cannot be updated through this endpoint (use reset password endpoint instead).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Staff member's full name |
| `cid` | string | No | Citizen ID (must be unique if changed) |
| `emailAddress` | string | No | Email address (must be unique if changed) |
| `phoneNumber` | string | No | Phone number |
| `department` | string | No | Department name |
| `position` | string | No | Job position/title |
| `address` | string | No | Physical address |
| `dateOfBirth` | date | No | Date of birth (ISO format) |
| `hireDate` | date | No | Hire date (ISO format) |
| `employeeStatus` | enum | No | Status: `ACTIVE`, `INACTIVE`, or `TERMINATED` |
| `terminationDate` | date | No | Termination date (ISO format) |
| `profileImageUrl` | string | No | URL or path to staff member's profile image |

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Tenzin Wangmo Updated",
  "cid": "11901012345",
  "emailAddress": "tenzin.wangmo@example.com",
  "phoneNumber": "+975-17987654",
  "role": "STAFF",
  "department": "Marketing",
  "position": "Marketing Manager",
  "address": "123 Main Street, Thimphu, Bhutan",
  "dateOfBirth": "1990-05-15T00:00:00.000Z",
  "hireDate": "2024-01-15T00:00:00.000Z",
  "employeeStatus": "ACTIVE",
  "employeeId": null,
  "terminationDate": null,
  "profileImageUrl": "https://example.com/uploads/profiles/tenzin-wangmo.jpg",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:45:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Staff member not found
  ```json
  {
    "statusCode": 404,
    "message": "Staff member not found",
    "error": "Not Found"
  }
  ```

- `409 Conflict` - CID or email already exists (if changed to existing value)
  ```json
  {
    "statusCode": 409,
    "message": "User with this email already exists",
    "error": "Conflict"
  }
  ```

---

### 5. Reset Staff Password

Reset the password for a staff member. This is an admin-only operation.

**Endpoint:** `POST /employee-management/staff/:id/reset-password`

**Authentication:** Required (ADMIN only)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Staff member's unique identifier |

**Request Body:**
```json
{
  "newPassword": "newSecurePassword456"
}
```

**Request Body Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `newPassword` | string | Yes | New password (minimum 6 characters) |

**Response:** `200 OK`
```json
{
  "message": "Staff password has been reset successfully"
}
```

**Error Responses:**
- `404 Not Found` - Staff member not found
  ```json
  {
    "statusCode": 404,
    "message": "Staff member not found",
    "error": "Not Found"
  }
  ```

- `400 Bad Request` - Validation error
  ```json
  {
    "statusCode": 400,
    "message": ["newPassword must be longer than or equal to 6 characters"],
    "error": "Bad Request"
  }
  ```

---

### 6. Delete Staff Member

Remove a staff member from the system.

**Endpoint:** `DELETE /employee-management/staff/:id`

**Authentication:** Required (ADMIN only)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Staff member's unique identifier |

**Response:** `200 OK`
```json
{
  "message": "Staff member has been removed successfully"
}
```

**Error Responses:**
- `404 Not Found` - Staff member not found
  ```json
  {
    "statusCode": 404,
    "message": "Staff member not found",
    "error": "Not Found"
  }
  ```

---

### 7. Get Staff Education Qualifications

Retrieve all education qualifications for a specific staff member.

**Endpoint:** `GET /employee-management/staff/:id/education`

**Authentication:** Required (ADMIN only)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Staff member's unique identifier |

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "userId": 1,
    "level": "Class X",
    "courseTitle": "Class X - General",
    "institute": "Chukha Higher Secondary School",
    "startDate": "2011-02-15T00:00:00.000Z",
    "endDate": "2011-12-17T00:00:00.000Z",
    "durationDays": 305,
    "funding": null,
    "status": "Completed",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": 2,
    "userId": 1,
    "level": "Class XII",
    "courseTitle": "Class XII - Science",
    "institute": "Chukha Higher Secondary School",
    "startDate": "2013-01-01T00:00:00.000Z",
    "endDate": "2013-12-31T00:00:00.000Z",
    "durationDays": 364,
    "funding": null,
    "status": "Completed",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": 3,
    "userId": 1,
    "level": "Bachelors",
    "courseTitle": "Urban Planning",
    "institute": "University of Moratuwa",
    "startDate": "2015-03-01T00:00:00.000Z",
    "endDate": "2018-12-31T00:00:00.000Z",
    "durationDays": 1401,
    "funding": null,
    "status": "Completed",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

**Error Responses:**
- `404 Not Found` - Staff member not found
  ```json
  {
    "statusCode": 404,
    "message": "Staff member not found",
    "error": "Not Found"
  }
  ```

---

### 8. Add Education Qualification

Add a new education qualification for a staff member.

**Endpoint:** `POST /employee-management/staff/:id/education`

**Authentication:** Required (ADMIN only)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Staff member's unique identifier |

**Request Body:**
```json
{
  "level": "Bachelors",
  "courseTitle": "Urban Planning",
  "institute": "University of Moratuwa",
  "startDate": "2015-03-01",
  "endDate": "2018-12-31",
  "durationDays": 1401,
  "funding": null,
  "status": "Completed"
}
```

**Request Body Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `level` | string | Yes | Education level (e.g., "Class X", "Class XII", "Bachelors", "Masters", "PhD") |
| `courseTitle` | string | Yes | Title of the course or program |
| `institute` | string | Yes | Name of the educational institution |
| `startDate` | date | Yes | Start date (ISO format: YYYY-MM-DD) |
| `endDate` | date | Yes | End date (ISO format: YYYY-MM-DD) |
| `durationDays` | integer | No | Duration in days (automatically calculated from startDate and endDate if not provided) |
| `funding` | string | No | Funding source or scholarship information |
| `status` | string | Yes | Status: `Completed`, `Ongoing`, `Discontinued`, etc. |

**Response:** `201 Created`
```json
{
  "id": 3,
  "userId": 1,
  "level": "Bachelors",
  "courseTitle": "Urban Planning",
  "institute": "University of Moratuwa",
  "startDate": "2015-03-01T00:00:00.000Z",
  "endDate": "2018-12-31T00:00:00.000Z",
  "durationDays": 1401,
  "funding": null,
  "status": "Completed",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Staff member not found
- `400 Bad Request` - Validation errors

---

### 9. Update Education Qualification

Update an existing education qualification.

**Endpoint:** `PATCH /employee-management/staff/:id/education/:educationId`

**Authentication:** Required (ADMIN only)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Staff member's unique identifier |
| `educationId` | integer | Yes | Education qualification's unique identifier |

**Request Body:**
```json
{
  "status": "Completed",
  "funding": "Government Scholarship"
}
```

**Request Body Schema:**
All fields are optional.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `level` | string | No | Education level |
| `courseTitle` | string | No | Title of the course or program |
| `institute` | string | No | Name of the educational institution |
| `startDate` | date | No | Start date (ISO format) |
| `endDate` | date | No | End date (ISO format) |
| `durationDays` | integer | No | Duration in days (automatically recalculated if startDate or endDate is updated) |
| `funding` | string | No | Funding source or scholarship information |
| `status` | string | No | Status: `Completed`, `Ongoing`, `Discontinued`, etc. |

**Response:** `200 OK`
```json
{
  "id": 3,
  "userId": 1,
  "level": "Bachelors",
  "courseTitle": "Urban Planning",
  "institute": "University of Moratuwa",
  "startDate": "2015-03-01T00:00:00.000Z",
  "endDate": "2018-12-31T00:00:00.000Z",
  "durationDays": 1401,
  "funding": "Government Scholarship",
  "status": "Completed",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:45:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Staff member or education qualification not found
  ```json
  {
    "statusCode": 404,
    "message": "Education qualification not found",
    "error": "Not Found"
  }
  ```
- `400 Bad Request` - Validation errors
  ```json
  {
    "statusCode": 400,
    "message": ["endDate must be a valid ISO 8601 date string"],
    "error": "Bad Request"
  }
  ```

**Note:** When updating `startDate` or `endDate`, the `durationDays` will be automatically recalculated based on the new dates.

---

### 10. Delete Education Qualification

Remove an education qualification from a staff member's record.

**Endpoint:** `DELETE /employee-management/staff/:id/education/:educationId`

**Authentication:** Required (ADMIN only)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Staff member's unique identifier |
| `educationId` | integer | Yes | Education qualification's unique identifier |

**Response:** `200 OK`
```json
{
  "message": "Education qualification has been removed successfully"
}
```

**Error Responses:**
- `404 Not Found` - Staff member or education qualification not found
  ```json
  {
    "statusCode": 404,
    "message": "Education qualification not found",
    "error": "Not Found"
  }
  ```

---

### 11. Get Staff Work Experience

Retrieve all work experience/employment history for a specific staff member.

**Endpoint:** `GET /employee-management/staff/:id/work-experience`

**Authentication:** Required (ADMIN only)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Staff member's unique identifier |

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "userId": 1,
    "positionTitle": "Junior Urban Planner",
    "effectiveDate": "2019-01-15T00:00:00.000Z",
    "agency": "Thimphu City Corporation",
    "place": "Thimphu, Bhutan",
    "endDate": "2021-06-30T00:00:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": 2,
    "userId": 1,
    "positionTitle": "Senior Urban Planner",
    "effectiveDate": "2021-07-01T00:00:00.000Z",
    "agency": "Thimphu City Corporation",
    "place": "Thimphu, Bhutan",
    "endDate": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

**Note:** `endDate` is null for current positions.

**Error Responses:**
- `404 Not Found` - Staff member not found
  ```json
  {
    "statusCode": 404,
    "message": "Staff member not found",
    "error": "Not Found"
  }
  ```

---

### 12. Add Work Experience

Add a new work experience entry for a staff member.

**Endpoint:** `POST /employee-management/staff/:id/work-experience`

**Authentication:** Required (ADMIN only)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Staff member's unique identifier |

**Request Body:**
```json
{
  "positionTitle": "Senior Urban Planner",
  "effectiveDate": "2021-07-01",
  "agency": "Thimphu City Corporation",
  "place": "Thimphu, Bhutan",
  "endDate": null
}
```

**Request Body Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `positionTitle` | string | Yes | Job title or position name |
| `effectiveDate` | date | Yes | Start date of the position (ISO format: YYYY-MM-DD) |
| `agency` | string | Yes | Name of the organization or agency |
| `place` | string | Yes | Location or place of work |
| `endDate` | date | No | End date of the position (ISO format: YYYY-MM-DD). Leave null for current positions |

**Response:** `201 Created`
```json
{
  "id": 2,
  "userId": 1,
  "positionTitle": "Senior Urban Planner",
  "effectiveDate": "2021-07-01T00:00:00.000Z",
  "agency": "Thimphu City Corporation",
  "place": "Thimphu, Bhutan",
  "endDate": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Staff member not found
- `400 Bad Request` - Validation errors

---

### 13. Update Work Experience

Update an existing work experience entry.

**Endpoint:** `PATCH /employee-management/staff/:id/work-experience/:experienceId`

**Authentication:** Required (ADMIN only)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Staff member's unique identifier |
| `experienceId` | integer | Yes | Work experience entry's unique identifier |

**Request Body:**
```json
{
  "endDate": "2024-12-31",
  "place": "Thimphu, Bhutan - Main Office"
}
```

**Request Body Schema:**
All fields are optional.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `positionTitle` | string | No | Job title or position name |
| `effectiveDate` | date | No | Start date of the position (ISO format) |
| `agency` | string | No | Name of the organization or agency |
| `place` | string | No | Location or place of work |
| `endDate` | date | No | End date of the position (ISO format). Set to null for current positions |

**Response:** `200 OK`
```json
{
  "id": 2,
  "userId": 1,
  "positionTitle": "Senior Urban Planner",
  "effectiveDate": "2021-07-01T00:00:00.000Z",
  "agency": "Thimphu City Corporation",
  "place": "Thimphu, Bhutan - Main Office",
  "endDate": "2024-12-31T00:00:00.000Z",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:45:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Staff member or work experience entry not found
  ```json
  {
    "statusCode": 404,
    "message": "Work experience entry not found",
    "error": "Not Found"
  }
  ```
- `400 Bad Request` - Validation errors
  ```json
  {
    "statusCode": 400,
    "message": ["effectiveDate must be a valid ISO 8601 date string"],
    "error": "Bad Request"
  }
  ```

**Note:** Setting `endDate` to `null` indicates a current/ongoing position. When updating dates, ensure `endDate` is either null or after `effectiveDate`.

---

### 14. Delete Work Experience

Remove a work experience entry from a staff member's record.

**Endpoint:** `DELETE /employee-management/staff/:id/work-experience/:experienceId`

**Authentication:** Required (ADMIN only)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Staff member's unique identifier |
| `experienceId` | integer | Yes | Work experience entry's unique identifier |

**Response:** `200 OK`
```json
{
  "message": "Work experience entry has been removed successfully"
}
```

**Error Responses:**
- `404 Not Found` - Staff member or work experience entry not found
  ```json
  {
    "statusCode": 404,
    "message": "Work experience entry not found",
    "error": "Not Found"
  }
  ```

---

## Data Models

### Staff Member Model

The staff member model is based on the User entity with the `STAFF` role.

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique identifier (auto-generated) |
| `name` | string | Full name |
| `cid` | string | Citizen ID (unique) |
| `emailAddress` | string | Email address (unique) |
| `phoneNumber` | string | Phone number |
| `password` | string | Hashed password (never returned in responses) |
| `role` | enum | User role: `STAFF` or `ADMIN` |
| `employeeId` | string | Optional employee ID |
| `department` | string | Department name |
| `position` | string | Job position/title |
| `hireDate` | date | Date of hire |
| `terminationDate` | date | Date of termination (if applicable) |
| `employeeStatus` | enum | Status: `ACTIVE`, `INACTIVE`, or `TERMINATED` |
| `address` | string | Physical address |
| `dateOfBirth` | date | Date of birth |
| `profileImageUrl` | string | URL or path to staff member's profile image |
| `createdAt` | date | Record creation timestamp |
| `updatedAt` | date | Record last update timestamp |

### Employee Education Model

Represents education qualifications for staff members. Each staff member can have multiple education qualifications.

**Entity Name:** `EmployeeEducation`

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique identifier (auto-generated) |
| `userId` | integer | Foreign key to User entity |
| `level` | string | Education level (e.g., "Class X", "Class XII", "Bachelors", "Masters", "PhD") |
| `courseTitle` | string | Title of the course or program |
| `institute` | string | Name of the educational institution |
| `startDate` | date | Start date of the education program |
| `endDate` | date | End date of the education program |
| `durationDays` | integer | Duration in days (can be calculated from start and end dates) |
| `funding` | string | Funding source or scholarship information (optional) |
| `status` | string | Status: `Completed`, `Ongoing`, `Discontinued`, etc. |
| `createdAt` | date | Record creation timestamp |
| `updatedAt` | date | Record last update timestamp |

**Relationship:** Many-to-One with User (a user can have many education qualifications)

---

### Employee Work Experience Model

Represents work experience/employment history for staff members. Each staff member can have multiple work experience entries.

**Entity Name:** `EmployeeWorkExperience`

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique identifier (auto-generated) |
| `userId` | integer | Foreign key to User entity |
| `positionTitle` | string | Job title or position name |
| `effectiveDate` | date | Start date of the position |
| `agency` | string | Name of the organization or agency |
| `place` | string | Location or place of work |
| `endDate` | date | End date of the position (null for current positions) |
| `createdAt` | date | Record creation timestamp |
| `updatedAt` | date | Record last update timestamp |

**Relationship:** Many-to-One with User (a user can have many work experience entries)

---

## Error Responses

### Standard Error Response Format

```json
{
  "statusCode": 400,
  "message": "Error message or array of validation errors",
  "error": "Error Type"
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data or validation errors
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User lacks required permissions (not ADMIN)
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate email or CID)
- `500 Internal Server Error` - Server error

---

## Examples

### Example 1: Create a New Staff Member

**Request:**
```bash
curl -X POST http://localhost:3000/api/employee-management/staff \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tenzin Wangmo",
    "cid": "11901012345",
    "emailAddress": "tenzin.wangmo@example.com",
    "phoneNumber": "+975-17123456",
    "password": "securePassword123",
    "department": "Sales",
    "position": "Sales Representative",
    "address": "123 Main Street, Thimphu, Bhutan",
    "dateOfBirth": "1990-05-15",
    "hireDate": "2024-01-15",
    "profileImageUrl": "https://example.com/uploads/profiles/tenzin-wangmo.jpg"
  }'
```

**Response:**
```json
{
  "id": 1,
  "name": "Tenzin Wangmo",
  "cid": "11901012345",
  "emailAddress": "tenzin.wangmo@example.com",
  "phoneNumber": "+975-17123456",
  "role": "STAFF",
  "department": "Sales",
  "position": "Sales Representative",
  "address": "123 Main Street, Thimphu, Bhutan",
  "dateOfBirth": "1990-05-15T00:00:00.000Z",
  "hireDate": "2024-01-15T00:00:00.000Z",
  "employeeStatus": "ACTIVE",
  "employeeId": null,
  "terminationDate": null,
  "profileImageUrl": "https://example.com/uploads/profiles/tenzin-wangmo.jpg",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Example 2: Get All Staff Members

**Request:**
```bash
curl -X GET http://localhost:3000/api/employee-management/staff \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 3: Update Staff Member

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/employee-management/staff/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "department": "Marketing",
    "position": "Marketing Manager",
    "employeeStatus": "ACTIVE"
  }'
```

### Example 4: Reset Staff Password

**Request:**
```bash
curl -X POST http://localhost:3000/api/employee-management/staff/1/reset-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newPassword": "newSecurePassword456"
  }'
```

**Response:**
```json
{
  "message": "Staff password has been reset successfully"
}
```

### Example 5: Terminate a Staff Member

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/employee-management/staff/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeStatus": "TERMINATED",
    "terminationDate": "2024-12-31"
  }'
```

### Example 6: Delete Staff Member

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/employee-management/staff/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "Staff member has been removed successfully"
}
```

### Example 7: Add Education Qualification

**Request:**
```bash
curl -X POST http://localhost:3000/api/employee-management/staff/1/education \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "level": "Bachelors",
    "courseTitle": "Urban Planning",
    "institute": "University of Moratuwa",
    "startDate": "2015-03-01",
    "endDate": "2018-12-31",
    "durationDays": 1401,
    "status": "Completed"
  }'
```

### Example 8: Get All Education Qualifications

**Request:**
```bash
curl -X GET http://localhost:3000/api/employee-management/staff/1/education \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 9: Add Work Experience

**Request:**
```bash
curl -X POST http://localhost:3000/api/employee-management/staff/1/work-experience \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "positionTitle": "Senior Urban Planner",
    "effectiveDate": "2021-07-01",
    "agency": "Thimphu City Corporation",
    "place": "Thimphu, Bhutan"
  }'
```

### Example 10: Get All Work Experience

**Request:**
```bash
curl -X GET http://localhost:3000/api/employee-management/staff/1/work-experience \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Security Considerations

1. **Password Security**: 
   - Passwords are hashed using bcrypt before storage
   - Passwords are never returned in API responses
   - Password updates must go through the reset password endpoint

2. **Authentication**: 
   - All endpoints require valid JWT authentication
   - Only ADMIN role can access these endpoints
   - JWT tokens should be stored securely on the client side

3. **Data Validation**: 
   - All input data is validated using class-validator
   - Email addresses must be unique
   - CID (Citizen ID) must be unique

4. **Error Handling**: 
   - Sensitive information is not exposed in error messages
   - Generic error messages are used to prevent information leakage

---

## Notes

- All date fields accept ISO 8601 format (YYYY-MM-DD)
- The `employeeStatus` field can be set to `ACTIVE`, `INACTIVE`, or `TERMINATED`
- When a staff member is terminated, set both `employeeStatus` to `TERMINATED` and `terminationDate` to the termination date
- Password reset is a separate operation from updating staff details for security reasons
- Staff members created through this API automatically have the `STAFF` role assigned
- The `employeeId` field is optional and can be used for external employee ID systems
- Profile images should be uploaded to a secure location and the URL stored in `profileImageUrl`
- Education qualifications are stored in a separate `EmployeeEducation` entity with a many-to-one relationship to User
- Work experience entries are stored in a separate `EmployeeWorkExperience` entity with a many-to-one relationship to User
- Duration in days for education is automatically calculated from `startDate` and `endDate` if not provided in the request
- When updating education dates, `durationDays` is automatically recalculated
- Work experience entries with null `endDate` are considered current/ongoing positions
- Education qualifications are returned sorted by start date (most recent first)
- Work experience entries are returned sorted by effective date (most recent first)
- All date fields accept ISO 8601 format strings (YYYY-MM-DD) in requests and return ISO 8601 datetime strings in responses

---

## Implementation Details

### Automatic Duration Calculation

The system automatically calculates `durationDays` for education qualifications:

- **On Create:** If `durationDays` is not provided, it's calculated as the difference between `startDate` and `endDate` (inclusive of both dates)
- **On Update:** If either `startDate` or `endDate` is updated, `durationDays` is automatically recalculated

**Calculation Formula:**
```
durationDays = ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
```

### Data Relationships

- **User → EmployeeEducation:** One-to-Many relationship (one user can have many education qualifications)
- **User → EmployeeWorkExperience:** One-to-Many relationship (one user can have many work experience entries)
- Both relationships use foreign key `userId` referencing the `User.id` field

### Database Tables

The following database tables are automatically created:

- `users` - Main user/staff table (existing, updated with `profileImageUrl`)
- `employee_education` - Education qualifications table
- `employee_work_experience` - Work experience table

All tables include `createdAt` and `updatedAt` timestamps managed by Sequelize.

---

## Version History

### Version 2.0.0 (Current)
- Added profile image URL support (`profileImageUrl` field)
- Added education qualifications management (CRUD operations)
- Added work experience/employment history management (CRUD operations)
- Automatic duration calculation for education qualifications
- Enhanced error responses with detailed messages

### Version 1.0.0
- Initial release with basic staff management (create, read, update, delete)
- Password reset functionality
- Staff status management

