# Angular Hierarchical Dropdown Selection - Implementation Guide

## Overview

This guide provides instructions for implementing a 4-level hierarchical dropdown selection system in Angular TypeScript for selecting Enumeration Areas through their parent administrative divisions.

## Hierarchy Structure

```
Dzongkhag (Level 1)
    └── Administrative Zone (Level 2)
            └── Sub-Administrative Zone (Level 3)
                    └── Enumeration Area (Level 4)
```

## Backend API Endpoints

### Available Endpoints

#### 1. Get All Dzongkhags (Public)
```
GET /dzongkhag/all
```
Returns all dzongkhags without authentication.

**Response:**
```typescript
[
  {
    id: number;
    name: string;
    areaCode: string;
    areaSqKm: number;
  }
]
```

#### 2. Get Administrative Zones by Dzongkhag
```
GET /administrative-zone?dzongkhagId={dzongkhagId}
// OR
GET /administrative-zone/by-dzongkhag/{dzongkhagId}
```

**Response:**
```typescript
[
  {
    id: number;
    dzongkhagId: number;
    name: string;
    areaCode: string;
    type: 'Gewog' | 'Thromde';
    areaSqKm: number;
  }
]
```

#### 3. Get Sub-Administrative Zones by Administrative Zone
```
GET /sub-administrative-zone?administrativeZoneId={administrativeZoneId}
// OR
GET /sub-administrative-zone/by-administrative-zone/{administrativeZoneId}
```

**Response:**
```typescript
[
  {
    id: number;
    administrativeZoneId: number;
    name: string;
    areaCode: string;
    type: 'CHIWOG' | 'LAP';
    areaSqKm: number;
  }
]
```

#### 4. Get Enumeration Areas by Sub-Administrative Zone
```
GET /enumeration-area?subAdministrativeZoneId={subAdministrativeZoneId}
// OR
GET /enumeration-area/by-sub-administrative-zone/{subAdministrativeZoneId}
```

**Response:**
```typescript
[
  {
    id: number;
    subAdministrativeZoneId: number;
    name: string;
    areaCode: string;
    description: string;
    areaSqKm: number;
  }
]
```

## Angular Implementation

### 1. TypeScript Interfaces

Create `geographic-hierarchy.model.ts`:

```typescript
export interface Dzongkhag {
  id: number;
  name: string;
  areaCode: string;
  areaSqKm: number;
}

export interface AdministrativeZone {
  id: number;
  dzongkhagId: number;
  name: string;
  areaCode: string;
  type: 'Gewog' | 'Thromde';
  areaSqKm: number;
}

export interface SubAdministrativeZone {
  id: number;
  administrativeZoneId: number;
  name: string;
  areaCode: string;
  type: 'CHIWOG' | 'LAP';
  areaSqKm: number;
}

export interface EnumerationArea {
  id: number;
  subAdministrativeZoneId: number;
  name: string;
  areaCode: string;
  description: string;
  areaSqKm: number;
}
```

### 2. Data Service

Create `geographic-hierarchy.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Dzongkhag,
  AdministrativeZone,
  SubAdministrativeZone,
  EnumerationArea
} from '../models/geographic-hierarchy.model';

@Injectable({
  providedIn: 'root'
})
export class GeographicHierarchyService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // Level 1: Get all Dzongkhags
  getAllDzongkhags(): Observable<Dzongkhag[]> {
    return this.http.get<Dzongkhag[]>(`${this.baseUrl}/dzongkhag/all`);
  }

  // Level 2: Get Administrative Zones by Dzongkhag
  getAdministrativeZonesByDzongkhag(dzongkhagId: number): Observable<AdministrativeZone[]> {
    return this.http.get<AdministrativeZone[]>(
      `${this.baseUrl}/administrative-zone?dzongkhagId=${dzongkhagId}`
    );
  }

  // Alternative method using path parameter
  getAdministrativeZonesByDzongkhagAlt(dzongkhagId: number): Observable<AdministrativeZone[]> {
    return this.http.get<AdministrativeZone[]>(
      `${this.baseUrl}/administrative-zone/by-dzongkhag/${dzongkhagId}`
    );
  }

  // Level 3: Get Sub-Administrative Zones by Administrative Zone
  getSubAdministrativeZonesByAdminZone(
    administrativeZoneId: number
  ): Observable<SubAdministrativeZone[]> {
    return this.http.get<SubAdministrativeZone[]>(
      `${this.baseUrl}/sub-administrative-zone?administrativeZoneId=${administrativeZoneId}`
    );
  }

  // Alternative method using path parameter
  getSubAdministrativeZonesByAdminZoneAlt(
    administrativeZoneId: number
  ): Observable<SubAdministrativeZone[]> {
    return this.http.get<SubAdministrativeZone[]>(
      `${this.baseUrl}/sub-administrative-zone/by-administrative-zone/${administrativeZoneId}`
    );
  }

  // Level 4: Get Enumeration Areas by Sub-Administrative Zone
  getEnumerationAreasBySubAdminZone(
    subAdministrativeZoneId: number
  ): Observable<EnumerationArea[]> {
    return this.http.get<EnumerationArea[]>(
      `${this.baseUrl}/enumeration-area?subAdministrativeZoneId=${subAdministrativeZoneId}`
    );
  }

  // Alternative method using path parameter
  getEnumerationAreasBySubAdminZoneAlt(
    subAdministrativeZoneId: number
  ): Observable<EnumerationArea[]> {
    return this.http.get<EnumerationArea[]>(
      `${this.baseUrl}/enumeration-area/by-sub-administrative-zone/${subAdministrativeZoneId}`
    );
  }
}
```

### 3. Component Implementation

Create `hierarchical-dropdown.component.ts`:

```typescript
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GeographicHierarchyService } from '../services/geographic-hierarchy.service';
import {
  Dzongkhag,
  AdministrativeZone,
  SubAdministrativeZone,
  EnumerationArea
} from '../models/geographic-hierarchy.model';

@Component({
  selector: 'app-hierarchical-dropdown',
  templateUrl: './hierarchical-dropdown.component.html',
  styleUrls: ['./hierarchical-dropdown.component.scss']
})
export class HierarchicalDropdownComponent implements OnInit {
  hierarchyForm: FormGroup;

  // Dropdown options
  dzongkhags: Dzongkhag[] = [];
  administrativeZones: AdministrativeZone[] = [];
  subAdministrativeZones: SubAdministrativeZone[] = [];
  enumerationAreas: EnumerationArea[] = [];

  // Loading states
  loadingDzongkhags = false;
  loadingAdminZones = false;
  loadingSubAdminZones = false;
  loadingEAs = false;

  // Event emitter for selected enumeration area
  @Output() enumerationAreaSelected = new EventEmitter<EnumerationArea>();

  constructor(
    private fb: FormBuilder,
    private geoService: GeographicHierarchyService
  ) {
    this.hierarchyForm = this.fb.group({
      dzongkhag: [null, Validators.required],
      administrativeZone: [{ value: null, disabled: true }, Validators.required],
      subAdministrativeZone: [{ value: null, disabled: true }, Validators.required],
      enumerationArea: [{ value: null, disabled: true }, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadDzongkhags();
    this.setupFormListeners();
  }

  // Load Level 1: Dzongkhags
  loadDzongkhags(): void {
    this.loadingDzongkhags = true;
    this.geoService.getAllDzongkhags().subscribe({
      next: (data) => {
        this.dzongkhags = data;
        this.loadingDzongkhags = false;
      },
      error: (error) => {
        console.error('Error loading dzongkhags:', error);
        this.loadingDzongkhags = false;
      }
    });
  }

  // Setup form value change listeners
  setupFormListeners(): void {
    // When Dzongkhag changes, load Administrative Zones
    this.hierarchyForm.get('dzongkhag')?.valueChanges.subscribe((dzongkhagId) => {
      this.onDzongkhagChange(dzongkhagId);
    });

    // When Administrative Zone changes, load Sub-Administrative Zones
    this.hierarchyForm.get('administrativeZone')?.valueChanges.subscribe((adminZoneId) => {
      this.onAdministrativeZoneChange(adminZoneId);
    });

    // When Sub-Administrative Zone changes, load Enumeration Areas
    this.hierarchyForm.get('subAdministrativeZone')?.valueChanges.subscribe((subAdminZoneId) => {
      this.onSubAdministrativeZoneChange(subAdminZoneId);
    });

    // When Enumeration Area is selected, emit event
    this.hierarchyForm.get('enumerationArea')?.valueChanges.subscribe((eaId) => {
      this.onEnumerationAreaChange(eaId);
    });
  }

  // Level 1 Change Handler
  onDzongkhagChange(dzongkhagId: number | null): void {
    // Reset dependent dropdowns
    this.administrativeZones = [];
    this.subAdministrativeZones = [];
    this.enumerationAreas = [];
    
    this.hierarchyForm.patchValue({
      administrativeZone: null,
      subAdministrativeZone: null,
      enumerationArea: null
    }, { emitEvent: false });

    if (!dzongkhagId) {
      this.hierarchyForm.get('administrativeZone')?.disable();
      this.hierarchyForm.get('subAdministrativeZone')?.disable();
      this.hierarchyForm.get('enumerationArea')?.disable();
      return;
    }

    // Load Administrative Zones
    this.loadingAdminZones = true;
    this.geoService.getAdministrativeZonesByDzongkhag(dzongkhagId).subscribe({
      next: (data) => {
        this.administrativeZones = data;
        this.hierarchyForm.get('administrativeZone')?.enable();
        this.loadingAdminZones = false;
      },
      error: (error) => {
        console.error('Error loading administrative zones:', error);
        this.loadingAdminZones = false;
      }
    });
  }

  // Level 2 Change Handler
  onAdministrativeZoneChange(adminZoneId: number | null): void {
    // Reset dependent dropdowns
    this.subAdministrativeZones = [];
    this.enumerationAreas = [];
    
    this.hierarchyForm.patchValue({
      subAdministrativeZone: null,
      enumerationArea: null
    }, { emitEvent: false });

    if (!adminZoneId) {
      this.hierarchyForm.get('subAdministrativeZone')?.disable();
      this.hierarchyForm.get('enumerationArea')?.disable();
      return;
    }

    // Load Sub-Administrative Zones
    this.loadingSubAdminZones = true;
    this.geoService.getSubAdministrativeZonesByAdminZone(adminZoneId).subscribe({
      next: (data) => {
        this.subAdministrativeZones = data;
        this.hierarchyForm.get('subAdministrativeZone')?.enable();
        this.loadingSubAdminZones = false;
      },
      error: (error) => {
        console.error('Error loading sub-administrative zones:', error);
        this.loadingSubAdminZones = false;
      }
    });
  }

  // Level 3 Change Handler
  onSubAdministrativeZoneChange(subAdminZoneId: number | null): void {
    // Reset dependent dropdown
    this.enumerationAreas = [];
    
    this.hierarchyForm.patchValue({
      enumerationArea: null
    }, { emitEvent: false });

    if (!subAdminZoneId) {
      this.hierarchyForm.get('enumerationArea')?.disable();
      return;
    }

    // Load Enumeration Areas
    this.loadingEAs = true;
    this.geoService.getEnumerationAreasBySubAdminZone(subAdminZoneId).subscribe({
      next: (data) => {
        this.enumerationAreas = data;
        this.hierarchyForm.get('enumerationArea')?.enable();
        this.loadingEAs = false;
      },
      error: (error) => {
        console.error('Error loading enumeration areas:', error);
        this.loadingEAs = false;
      }
    });
  }

  // Level 4 Change Handler
  onEnumerationAreaChange(eaId: number | null): void {
    if (eaId) {
      const selectedEA = this.enumerationAreas.find(ea => ea.id === eaId);
      if (selectedEA) {
        this.enumerationAreaSelected.emit(selectedEA);
      }
    }
  }

  // Helper method to get selected EA
  getSelectedEnumerationArea(): EnumerationArea | null {
    const eaId = this.hierarchyForm.get('enumerationArea')?.value;
    if (eaId) {
      return this.enumerationAreas.find(ea => ea.id === eaId) || null;
    }
    return null;
  }

  // Reset form
  reset(): void {
    this.hierarchyForm.reset();
    this.administrativeZones = [];
    this.subAdministrativeZones = [];
    this.enumerationAreas = [];
  }
}
```

### 4. HTML Template

Create `hierarchical-dropdown.component.html`:

```html
<form [formGroup]="hierarchyForm" class="hierarchical-dropdown">
  <!-- Level 1: Dzongkhag -->
  <div class="form-group">
    <label for="dzongkhag">
      Dzongkhag <span class="required">*</span>
    </label>
    <select 
      id="dzongkhag" 
      formControlName="dzongkhag" 
      class="form-control"
      [disabled]="loadingDzongkhags">
      <option [ngValue]="null">-- Select Dzongkhag --</option>
      <option *ngFor="let dzongkhag of dzongkhags" [ngValue]="dzongkhag.id">
        {{ dzongkhag.name }} ({{ dzongkhag.areaCode }})
      </option>
    </select>
    <small *ngIf="loadingDzongkhags" class="text-muted">Loading dzongkhags...</small>
  </div>

  <!-- Level 2: Administrative Zone -->
  <div class="form-group">
    <label for="administrativeZone">
      Administrative Zone (Gewog/Thromde) <span class="required">*</span>
    </label>
    <select 
      id="administrativeZone" 
      formControlName="administrativeZone" 
      class="form-control"
      [disabled]="loadingAdminZones">
      <option [ngValue]="null">-- Select Administrative Zone --</option>
      <option *ngFor="let zone of administrativeZones" [ngValue]="zone.id">
        {{ zone.name }} ({{ zone.type }}) - {{ zone.areaCode }}
      </option>
    </select>
    <small *ngIf="loadingAdminZones" class="text-muted">Loading administrative zones...</small>
  </div>

  <!-- Level 3: Sub-Administrative Zone -->
  <div class="form-group">
    <label for="subAdministrativeZone">
      Sub-Administrative Zone (Chiwog/Lap) <span class="required">*</span>
    </label>
    <select 
      id="subAdministrativeZone" 
      formControlName="subAdministrativeZone" 
      class="form-control"
      [disabled]="loadingSubAdminZones">
      <option [ngValue]="null">-- Select Sub-Administrative Zone --</option>
      <option *ngFor="let subZone of subAdministrativeZones" [ngValue]="subZone.id">
        {{ subZone.name }} ({{ subZone.type }}) - {{ subZone.areaCode }}
      </option>
    </select>
    <small *ngIf="loadingSubAdminZones" class="text-muted">Loading sub-administrative zones...</small>
  </div>

  <!-- Level 4: Enumeration Area -->
  <div class="form-group">
    <label for="enumerationArea">
      Enumeration Area <span class="required">*</span>
    </label>
    <select 
      id="enumerationArea" 
      formControlName="enumerationArea" 
      class="form-control"
      [disabled]="loadingEAs">
      <option [ngValue]="null">-- Select Enumeration Area --</option>
      <option *ngFor="let ea of enumerationAreas" [ngValue]="ea.id">
        {{ ea.name }} - {{ ea.areaCode }} ({{ ea.areaSqKm }} sq km)
      </option>
    </select>
    <small *ngIf="loadingEAs" class="text-muted">Loading enumeration areas...</small>
  </div>
</form>
```

### 5. SCSS Styling

Create `hierarchical-dropdown.component.scss`:

```scss
.hierarchical-dropdown {
  .form-group {
    margin-bottom: 1.5rem;

    label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #333;

      .required {
        color: #dc3545;
      }
    }

    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ced4da;
      border-radius: 0.25rem;
      font-size: 1rem;

      &:disabled {
        background-color: #e9ecef;
        cursor: not-allowed;
      }

      &:focus {
        border-color: #80bdff;
        outline: 0;
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
      }
    }

    .text-muted {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.875rem;
      color: #6c757d;
    }
  }
}
```

### 6. Usage in Parent Component

```typescript
// parent.component.ts
import { Component } from '@angular/core';
import { EnumerationArea } from './models/geographic-hierarchy.model';

@Component({
  selector: 'app-parent',
  template: `
    <div class="container">
      <h2>Select Enumeration Area</h2>
      <app-hierarchical-dropdown
        (enumerationAreaSelected)="onEnumerationAreaSelected($event)">
      </app-hierarchical-dropdown>
      
      <div *ngIf="selectedEA" class="selected-info">
        <h3>Selected Enumeration Area:</h3>
        <p><strong>Name:</strong> {{ selectedEA.name }}</p>
        <p><strong>Code:</strong> {{ selectedEA.areaCode }}</p>
        <p><strong>Area:</strong> {{ selectedEA.areaSqKm }} sq km</p>
      </div>
    </div>
  `
})
export class ParentComponent {
  selectedEA: EnumerationArea | null = null;

  onEnumerationAreaSelected(ea: EnumerationArea): void {
    this.selectedEA = ea;
    console.log('Selected Enumeration Area:', ea);
    // Use the selected EA for your logic
  }
}
```

## Flow Diagram

```
User Opens Form
    ↓
Load All Dzongkhags (GET /dzongkhag/all)
    ↓
User Selects Dzongkhag (ID: 1)
    ↓
Load Administrative Zones (GET /administrative-zone?dzongkhagId=1)
    ↓
Enable Administrative Zone dropdown
    ↓
User Selects Administrative Zone (ID: 5)
    ↓
Load Sub-Administrative Zones (GET /sub-administrative-zone?administrativeZoneId=5)
    ↓
Enable Sub-Administrative Zone dropdown
    ↓
User Selects Sub-Administrative Zone (ID: 12)
    ↓
Load Enumeration Areas (GET /enumeration-area?subAdministrativeZoneId=12)
    ↓
Enable Enumeration Area dropdown
    ↓
User Selects Enumeration Area (ID: 45)
    ↓
Emit Event / Use Selected EA
```

## Key Features

1. **Cascading Dropdowns**: Each dropdown is disabled until its parent is selected
2. **Auto-Reset**: When a parent dropdown changes, all child dropdowns reset
3. **Loading States**: Visual feedback during data loading
4. **Validation**: All fields are required
5. **Event Emission**: Selected enumeration area is emitted to parent component
6. **Error Handling**: Graceful error handling with console logs
7. **Public API**: No authentication required for dropdown data

## Best Practices

1. **Caching**: Consider implementing caching for frequently accessed data
2. **Debouncing**: Add debouncing if dropdowns trigger expensive operations
3. **Accessibility**: Add ARIA labels and keyboard navigation support
4. **Mobile Support**: Ensure dropdowns work well on mobile devices
5. **Search/Filter**: Add search functionality for large lists
6. **Lazy Loading**: Implement virtual scrolling for very large datasets

## Alternative: Multi-Select Support

To support multiple enumeration areas, modify the form control and template:

```typescript
// Use an array for multiple selection
enumerationArea: [[], Validators.required]
```

```html
<!-- Multi-select dropdown -->
<select 
  id="enumerationArea" 
  formControlName="enumerationArea" 
  class="form-control"
  multiple
  size="5">
  <option *ngFor="let ea of enumerationAreas" [ngValue]="ea.id">
    {{ ea.name }} - {{ ea.areaCode }}
  </option>
</select>
```

## Backend Base URL

```
http://localhost:3000
```

## Notes

- All dropdown endpoints are **public** (no authentication required)
- Data is loaded dynamically based on parent selection
- Each level depends on the previous level's selection
- Form validation ensures all levels are selected before submission
- The component can be reused across different forms requiring EA selection
