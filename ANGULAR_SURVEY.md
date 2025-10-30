# Angular Frontend Generation Instructions for Survey Module

## Entity Structure

Create an Angular TypeScript frontend for the Survey module based on the following NestJS backend entities:

### Backend Entity (Survey)

```typescript
{
  id: number;                        // Primary key, auto-increment
  name: string;                      // Required
  description: string;               // Required
  startDate: Date;                   // Date only, Required
  endDate: Date;                     // Date only, Required
  status: 'ACTIVE' | 'ENDED';        // ENUM, default: 'ACTIVE'
  isSubmitted: boolean;              // default: false
  isVerified: boolean;               // default: false
  createdAt: Date;                   // Timestamp
  updatedAt: Date;                   // Timestamp
  enumerationAreas: EnumerationArea[]; // Many-to-many relationship
}
```

### Backend Entity (SurveyEnumerationArea)

Junction table for many-to-many relationship:
```typescript
{
  surveyId: number;                  // Foreign key to Survey
  enumerationAreaId: number;         // Foreign key to EnumerationArea
}
```

## Required Angular Components

### 1. TypeScript Interfaces/Models

#### `survey.model.ts`

```typescript
export enum SurveyStatus {
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED'
}

export interface Survey {
  id: number;
  name: string;
  description: string;
  startDate: string | Date;  // ISO date string or Date object
  endDate: string | Date;
  status: SurveyStatus;
  isSubmitted: boolean;
  isVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  enumerationAreas?: EnumerationArea[];
}

export interface EnumerationArea {
  id: number;
  name: string;
  areaCode: string;
  description: string;
  areaSqKm: number;
  subAdministrativeZoneId: number;
}

export interface SurveyEnumerationArea {
  surveyId: number;
  enumerationAreaId: number;
}
```

### 2. Create DTO (`create-survey.dto.ts`)

```typescript
import { SurveyStatus } from '../models/survey.model';

export interface CreateSurveyDto {
  name: string;
  description: string;
  startDate: string;  // ISO date string (YYYY-MM-DD)
  endDate: string;    // ISO date string (YYYY-MM-DD)
  status?: SurveyStatus;
  isSubmitted?: boolean;
  isVerified?: boolean;
  enumerationAreaIds?: number[];  // Array of EA IDs to associate
}
```

### 3. Update DTO (`update-survey.dto.ts`)

```typescript
import { SurveyStatus } from '../models/survey.model';

export interface UpdateSurveyDto {
  name?: string;
  description?: string;
  startDate?: string;  // ISO date string (YYYY-MM-DD)
  endDate?: string;    // ISO date string (YYYY-MM-DD)
  status?: SurveyStatus;
  isSubmitted?: boolean;
  isVerified?: boolean;
  enumerationAreaIds?: number[];  // Update associated EAs
}
```

### 4. Data Service (`survey.service.ts`)

Create a service with the following methods corresponding to the backend API:

#### Backend API Endpoints:

1. **POST** `/survey` - Create survey (Auth: ADMIN)
2. **GET** `/survey` - Get all surveys (Public)
3. **GET** `/survey/:id` - Get single survey (Public)
4. **PATCH** `/survey/:id` - Update survey (Auth: ADMIN)
5. **DELETE** `/survey/:id` - Delete survey (Auth: ADMIN)
6. **POST** `/survey/:id/enumeration-areas` - Add enumeration areas to survey (Auth: ADMIN)
7. **DELETE** `/survey/:id/enumeration-areas` - Remove enumeration areas from survey (Auth: ADMIN)

#### Service Methods to Implement:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Survey } from '../models/survey.model';
import { CreateSurveyDto } from '../dto/create-survey.dto';
import { UpdateSurveyDto } from '../dto/update-survey.dto';

@Injectable({
  providedIn: 'root'
})
export class SurveyService {
  private apiUrl = 'http://localhost:3000/survey';

  constructor(private http: HttpClient) {}

  // Create a new survey
  create(dto: CreateSurveyDto): Observable<Survey> {
    return this.http.post<Survey>(this.apiUrl, dto);
  }

  // Get all surveys with associated enumeration areas
  findAll(): Observable<Survey[]> {
    return this.http.get<Survey[]>(this.apiUrl);
  }

  // Get a single survey by ID with associated enumeration areas
  findOne(id: number): Observable<Survey> {
    return this.http.get<Survey>(`${this.apiUrl}/${id}`);
  }

  // Update a survey
  update(id: number, dto: UpdateSurveyDto): Observable<Survey> {
    return this.http.patch<Survey>(`${this.apiUrl}/${id}`, dto);
  }

  // Delete a survey
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Add enumeration areas to a survey
  addEnumerationAreas(surveyId: number, enumerationAreaIds: number[]): Observable<Survey> {
    return this.http.post<Survey>(
      `${this.apiUrl}/${surveyId}/enumeration-areas`,
      { enumerationAreaIds }
    );
  }

  // Remove enumeration areas from a survey
  removeEnumerationAreas(surveyId: number, enumerationAreaIds: number[]): Observable<Survey> {
    return this.http.delete<Survey>(
      `${this.apiUrl}/${surveyId}/enumeration-areas`,
      { body: { enumerationAreaIds } }
    );
  }
}
```

### 5. Form Validation Rules

When creating Angular Reactive Forms, apply these validation rules:

- **name**: Required, string
- **description**: Required, string
- **startDate**: Required, valid date string (YYYY-MM-DD format)
- **endDate**: Required, valid date string (YYYY-MM-DD format), must be >= startDate
- **status**: Optional, must be 'ACTIVE' or 'ENDED'
- **isSubmitted**: Optional, boolean
- **isVerified**: Optional, boolean
- **enumerationAreaIds**: Optional, array of positive integers

### 6. Sample Reactive Form Setup

```typescript
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SurveyStatus } from '../models/survey.model';

this.surveyForm = this.fb.group({
  name: ['', Validators.required],
  description: ['', Validators.required],
  startDate: ['', Validators.required],
  endDate: ['', Validators.required],
  status: [SurveyStatus.ACTIVE],
  isSubmitted: [false],
  isVerified: [false],
  enumerationAreaIds: [[]]  // Array of selected EA IDs
}, {
  validators: this.dateRangeValidator  // Custom validator for date range
});

// Custom validator to ensure endDate >= startDate
dateRangeValidator(group: FormGroup): { [key: string]: any } | null {
  const start = group.get('startDate')?.value;
  const end = group.get('endDate')?.value;
  
  if (start && end && new Date(end) < new Date(start)) {
    return { dateRange: 'End date must be after or equal to start date' };
  }
  return null;
}
```

### 7. Authentication Requirements

The following routes require JWT authentication with **ADMIN role only**:
- **Create**: POST /survey
- **Update**: PATCH /survey/:id
- **Delete**: DELETE /survey/:id
- **Add Enumeration Areas**: POST /survey/:id/enumeration-areas
- **Remove Enumeration Areas**: DELETE /survey/:id/enumeration-areas

Public routes (no authentication):
- **Get All**: GET /survey
- **Get One**: GET /survey/:id

Include JWT token in request headers:
```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### 8. Component Features to Implement

#### List Component (`survey-list.component`)
- Display all surveys in a table/grid
- Show: Name, Start Date, End Date, Status, Submission Status, Verification Status
- Filter by status (ACTIVE/ENDED)
- Filter by date range
- Show count of associated enumeration areas
- Actions: View, Edit, Delete (ADMIN only)
- Status badges with color coding:
  - ACTIVE: Green
  - ENDED: Gray
  - Submitted: Blue
  - Verified: Success/Green

#### Create/Edit Component (`survey-form.component`)
- Reactive form with validation
- Name input (text)
- Description textarea
- Start date picker (date only)
- End date picker (date only) with validation
- Status dropdown (ACTIVE/ENDED)
- Checkboxes for isSubmitted and isVerified
- Multi-select dropdown/list for enumeration areas
- Date range validation (endDate >= startDate)
- Success/error notifications
- Navigation after successful creation/update

#### Detail Component (`survey-detail.component`)
- Display all survey information
- Show date range
- Display status with badge
- Show submission and verification status
- List all associated enumeration areas with details:
  - EA Name
  - Area Code
  - Description
  - Area (sq km)
- Button to manage enumeration areas (ADMIN only)
- Edit and Delete buttons (ADMIN only)

#### Enumeration Area Management Component (`survey-ea-management.component`)
- Modal/page to add/remove enumeration areas
- List of all available enumeration areas
- Show currently associated EAs
- Checkboxes to select/deselect EAs
- Bulk add/remove functionality
- Save button to update associations

### 9. Display Calculations & Utilities

Add computed properties and utility functions:

```typescript
// Calculate survey duration in days
getSurveyDuration(survey: Survey): number {
  const start = new Date(survey.startDate);
  const end = new Date(survey.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Check if survey is currently active (based on dates)
isSurveyActive(survey: Survey): boolean {
  const today = new Date();
  const start = new Date(survey.startDate);
  const end = new Date(survey.endDate);
  return today >= start && today <= end;
}

// Format date for display
formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString();
}

// Get status badge class
getStatusBadgeClass(status: SurveyStatus): string {
  return status === SurveyStatus.ACTIVE ? 'badge-success' : 'badge-secondary';
}

// Count associated enumeration areas
getEACount(survey: Survey): number {
  return survey.enumerationAreas?.length || 0;
}
```

### 10. Error Handling

Handle these common errors:
- 400 Bad Request - Invalid data (e.g., endDate before startDate)
- 401 Unauthorized - Not authenticated
- 403 Forbidden - Not ADMIN role
- 404 Not Found - Survey not found
- 409 Conflict - Enumeration area already associated
- 500 Internal Server Error

### 11. File Structure

```
src/app/modules/survey/
├── models/
│   └── survey.model.ts
├── dto/
│   ├── create-survey.dto.ts
│   └── update-survey.dto.ts
├── services/
│   └── survey.service.ts
├── components/
│   ├── list/
│   │   ├── survey-list.component.ts
│   │   ├── survey-list.component.html
│   │   └── survey-list.component.scss
│   ├── form/
│   │   ├── survey-form.component.ts
│   │   ├── survey-form.component.html
│   │   └── survey-form.component.scss
│   ├── detail/
│   │   ├── survey-detail.component.ts
│   │   ├── survey-detail.component.html
│   │   └── survey-detail.component.scss
│   └── ea-management/
│       ├── survey-ea-management.component.ts
│       ├── survey-ea-management.component.html
│       └── survey-ea-management.component.scss
└── survey-routing.module.ts
```

### 12. Routing Configuration

```typescript
import { Routes } from '@angular/router';
import { AuthGuard } from '@auth/guards/auth.guard';
import { AdminGuard } from '@auth/guards/admin.guard';

const routes: Routes = [
  {
    path: '',
    component: SurveyListComponent
  },
  {
    path: 'create',
    component: SurveyFormComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'edit/:id',
    component: SurveyFormComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: ':id',
    component: SurveyDetailComponent
  },
  {
    path: ':id/manage-areas',
    component: SurveyEaManagementComponent,
    canActivate: [AuthGuard, AdminGuard]
  }
];
```

### 13. Additional Features to Implement

#### Survey Status Management
- Auto-update status to 'ENDED' when endDate is passed
- Visual indicator for surveys ending soon (within 7 days)
- Prevent editing of ENDED surveys unless ADMIN overrides

#### Bulk Operations
- Bulk delete surveys (ADMIN only)
- Bulk status update
- Export survey list to CSV/Excel

#### Search & Filter
- Search by name or description
- Filter by:
  - Status (ACTIVE/ENDED)
  - Date range
  - Submission status
  - Verification status
  - Associated enumeration areas

#### Statistics Dashboard
- Total number of surveys
- Active vs Ended surveys
- Submission rate
- Verification rate
- Average survey duration
- Chart showing surveys timeline

## Backend Base URL

```
http://localhost:3000
```

## Important Notes

1. **Date Format**: Use ISO 8601 date strings (YYYY-MM-DD) for API calls
2. **Authentication**: Only ADMIN users can create, update, or delete surveys
3. **Many-to-Many Relationship**: 
   - Survey can have multiple enumeration areas
   - Enumeration area can be in multiple surveys
   - Junction table managed automatically by backend
4. **Status Management**: 
   - Status defaults to 'ACTIVE' on creation
   - Can be manually set to 'ENDED'
   - Consider implementing auto-status update based on dates
5. **Enumeration Areas**: 
   - Can be associated during survey creation via `enumerationAreaIds` array
   - Can be added/removed later via dedicated endpoints
   - When updating survey with `enumerationAreaIds`, it replaces all associations
6. **Timestamps**: Automatically managed by backend (createdAt, updatedAt)
7. **Validation**: Backend enforces all required fields and data types

## API Request/Response Examples

### Create Survey
```typescript
// Request
POST /survey
{
  "name": "Population Census 2025",
  "description": "National population and housing census",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "status": "ACTIVE",
  "enumerationAreaIds": [1, 2, 3, 4, 5]
}

// Response
{
  "id": 1,
  "name": "Population Census 2025",
  "description": "National population and housing census",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "status": "ACTIVE",
  "isSubmitted": false,
  "isVerified": false,
  "createdAt": "2025-10-29T10:30:00.000Z",
  "updatedAt": "2025-10-29T10:30:00.000Z",
  "enumerationAreas": [...]
}
```

### Add Enumeration Areas
```typescript
// Request
POST /survey/1/enumeration-areas
{
  "enumerationAreaIds": [6, 7, 8]
}

// Response: Returns updated survey with all enumeration areas
```

### Remove Enumeration Areas
```typescript
// Request
DELETE /survey/1/enumeration-areas
{
  "enumerationAreaIds": [6, 7]
}

// Response: Returns updated survey with remaining enumeration areas
```
