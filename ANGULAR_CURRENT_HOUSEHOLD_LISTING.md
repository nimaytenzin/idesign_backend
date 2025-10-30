# Angular Frontend Generation Instructions for Current Household Listing

## Entity Structure

Create an Angular TypeScript frontend for the Current Household Listing module based on the following NestJS backend entity:

### Backend Entity (CurrentHouseholdListing)

```typescript
{
  id: number;                        // Primary key, auto-increment
  eaId: number;                      // Foreign key to EnumerationArea
  structureNumber: string;           // Required
  householdIdentification: string;   // Required
  householdSerialNumber: number;     // Required
  nameOfHOH: string;                 // Name of Head of Household, Required
  totalMale: number;                 // Required, default: 0
  totalFemale: number;               // Required, default: 0
  phoneNumber: string;               // Optional
  remarks: string;                   // Optional
  createdAt: Date;                   // Timestamp
  updatedAt: Date;                   // Timestamp
  enumerationArea: EnumerationArea;  // Relationship object
}
```

## Required Angular Components

### 1. TypeScript Interface/Model (`current-household-listing.model.ts`)

```typescript
export interface CurrentHouseholdListing {
  id: number;
  eaId: number;
  structureNumber: string;
  householdIdentification: string;
  householdSerialNumber: number;
  nameOfHOH: string;
  totalMale: number;
  totalFemale: number;
  phoneNumber?: string;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
  enumerationArea?: EnumerationArea;
}

export interface EnumerationArea {
  id: number;
  name: string;
  areaCode: string;
  description: string;
}
```

### 2. Create DTO (`create-current-household-listing.dto.ts`)

```typescript
export interface CreateCurrentHouseholdListingDto {
  eaId: number;
  structureNumber: string;
  householdIdentification: string;
  householdSerialNumber: number;
  nameOfHOH: string;
  totalMale: number;
  totalFemale: number;
  phoneNumber?: string;
  remarks?: string;
}
```

### 3. Update DTO (`update-current-household-listing.dto.ts`)

```typescript
export interface UpdateCurrentHouseholdListingDto {
  eaId?: number;
  structureNumber?: string;
  householdIdentification?: string;
  householdSerialNumber?: number;
  nameOfHOH?: string;
  totalMale?: number;
  totalFemale?: number;
  phoneNumber?: string;
  remarks?: string;
}
```

### 4. Data Service (`current-household-listing.service.ts`)

Create a service with the following methods corresponding to the backend API:

#### Backend API Endpoints:

1. **POST** `/current-household-listing` - Create household listing (Auth: ADMIN, SUPERVISOR, ENUMERATOR)
2. **GET** `/current-household-listing` - Get all listings (Public)
3. **GET** `/current-household-listing?eaId=:eaId` - Get listings by enumeration area ID (Public)
4. **GET** `/current-household-listing/by-enumeration-area/:eaId` - Get listings by enumeration area (Public)
5. **GET** `/current-household-listing/:id` - Get single listing (Public)
6. **PATCH** `/current-household-listing/:id` - Update listing (Auth: ADMIN, SUPERVISOR, ENUMERATOR)
7. **DELETE** `/current-household-listing/:id` - Delete listing (Auth: ADMIN, SUPERVISOR)

#### Service Methods to Implement:

```typescript
@Injectable({
  providedIn: 'root'
})
export class CurrentHouseholdListingService {
  private apiUrl = 'http://localhost:3000/current-household-listing';

  constructor(private http: HttpClient) {}

  // Create a new household listing
  create(dto: CreateCurrentHouseholdListingDto): Observable<CurrentHouseholdListing> {
    return this.http.post<CurrentHouseholdListing>(this.apiUrl, dto);
  }

  // Get all household listings
  findAll(): Observable<CurrentHouseholdListing[]> {
    return this.http.get<CurrentHouseholdListing[]>(this.apiUrl);
  }

  // Get household listings by enumeration area ID (using query param)
  findByEnumerationArea(eaId: number): Observable<CurrentHouseholdListing[]> {
    return this.http.get<CurrentHouseholdListing[]>(`${this.apiUrl}?eaId=${eaId}`);
  }

  // Get household listings by enumeration area ID (using route param)
  findByEnumerationAreaRoute(eaId: number): Observable<CurrentHouseholdListing[]> {
    return this.http.get<CurrentHouseholdListing[]>(`${this.apiUrl}/by-enumeration-area/${eaId}`);
  }

  // Get a single household listing by ID
  findOne(id: number): Observable<CurrentHouseholdListing> {
    return this.http.get<CurrentHouseholdListing>(`${this.apiUrl}/${id}`);
  }

  // Update a household listing
  update(id: number, dto: UpdateCurrentHouseholdListingDto): Observable<CurrentHouseholdListing> {
    return this.http.patch<CurrentHouseholdListing>(`${this.apiUrl}/${id}`, dto);
  }

  // Delete a household listing
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

### 5. Form Validation Rules

When creating Angular Reactive Forms, apply these validation rules:

- **eaId**: Required, must be a positive integer
- **structureNumber**: Required, string
- **householdIdentification**: Required, string
- **householdSerialNumber**: Required, must be >= 1
- **nameOfHOH**: Required, string
- **totalMale**: Required, must be >= 0
- **totalFemale**: Required, must be >= 0
- **phoneNumber**: Optional, string
- **remarks**: Optional, string

### 6. Sample Reactive Form Setup

```typescript
this.householdForm = this.fb.group({
  eaId: [null, [Validators.required, Validators.min(1)]],
  structureNumber: ['', Validators.required],
  householdIdentification: ['', Validators.required],
  householdSerialNumber: [null, [Validators.required, Validators.min(1)]],
  nameOfHOH: ['', Validators.required],
  totalMale: [0, [Validators.required, Validators.min(0)]],
  totalFemale: [0, [Validators.required, Validators.min(0)]],
  phoneNumber: [''],
  remarks: ['']
});
```

### 7. Authentication Requirements

The following routes require JWT authentication:
- **Create**: Requires ADMIN, SUPERVISOR, or ENUMERATOR role
- **Update**: Requires ADMIN, SUPERVISOR, or ENUMERATOR role
- **Delete**: Requires ADMIN or SUPERVISOR role

Include JWT token in request headers:
```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### 8. Component Features to Implement

#### List Component
- Display all household listings in a table/grid
- Filter by enumeration area
- Show: Structure Number, Household ID, HOH Name, Total Male, Total Female, Phone
- Actions: View, Edit, Delete (based on user role)

#### Create/Edit Component
- Reactive form with validation
- Dropdown to select Enumeration Area (eaId)
- Input fields for all required properties
- Success/error notifications
- Navigation after successful creation/update

#### Detail Component
- Display all household listing information
- Show related enumeration area details
- Edit and Delete buttons (based on user role)

### 9. Display Calculations

Add computed properties for:
- **Total Members**: `totalMale + totalFemale`
- **Gender Ratio**: Display ratio or percentage of male/female

### 10. Error Handling

Handle these common errors:
- 400 Bad Request - Invalid data
- 401 Unauthorized - Not authenticated
- 403 Forbidden - Insufficient permissions
- 404 Not Found - Household listing not found
- 500 Internal Server Error

### 11. File Structure

```
src/app/modules/household-listings/current-household-listing/
├── models/
│   └── current-household-listing.model.ts
├── dto/
│   ├── create-current-household-listing.dto.ts
│   └── update-current-household-listing.dto.ts
├── services/
│   └── current-household-listing.service.ts
├── components/
│   ├── list/
│   │   ├── current-household-listing-list.component.ts
│   │   ├── current-household-listing-list.component.html
│   │   └── current-household-listing-list.component.css
│   ├── form/
│   │   ├── current-household-listing-form.component.ts
│   │   ├── current-household-listing-form.component.html
│   │   └── current-household-listing-form.component.css
│   └── detail/
│       ├── current-household-listing-detail.component.ts
│       ├── current-household-listing-detail.component.html
│       └── current-household-listing-detail.component.css
└── current-household-listing-routing.module.ts
```

### 12. Routing Configuration

```typescript
const routes: Routes = [
  {
    path: '',
    component: CurrentHouseholdListingListComponent
  },
  {
    path: 'create',
    component: CurrentHouseholdListingFormComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN', 'SUPERVISOR', 'ENUMERATOR'] }
  },
  {
    path: 'edit/:id',
    component: CurrentHouseholdListingFormComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN', 'SUPERVISOR', 'ENUMERATOR'] }
  },
  {
    path: ':id',
    component: CurrentHouseholdListingDetailComponent
  }
];
```

## Backend Base URL

```
http://localhost:3000
```

## Notes

- All GET endpoints are public (no authentication required)
- POST, PATCH, DELETE require authentication and specific roles
- The backend uses JWT authentication
- Timestamps (createdAt, updatedAt) are automatically managed by the backend
- The relationship with EnumerationArea is automatically populated when fetching
- Phone number is stored as string (not integer) for better formatting support
