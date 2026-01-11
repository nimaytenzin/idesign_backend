# Attendance Module Documentation

## Overview

The Attendance Module provides a location-based attendance tracking system for staff users. Staff members can mark their attendance only when they are within 5000 meters (5km) of the office location. The system prevents duplicate entries and provides a daily attendance view for both staff and administrators.

---

## Part 1: Data Models, DTOs, and Service

### 1. Entity: Attendance

**File**: `src/modules/attendance/entities/attendance.entity.ts`

The Attendance entity stores daily attendance records with location validation data.

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `INTEGER` | Primary key, auto-increment |
| `userId` | `INTEGER` | Foreign key to User table (required) |
| `date` | `DATEONLY` | Date of attendance (YYYY-MM-DD format) |
| `attendanceTime` | `DATE` | Timestamp when attendance was marked |
| `userLat` | `DOUBLE` | User's device latitude when marking attendance |
| `userLong` | `DOUBLE` | User's device longitude when marking attendance |
| `distanceFromOffice` | `DOUBLE` | Calculated distance from office in meters (rounded to 2 decimals) |
| `createdAt` | `DATE` | Record creation timestamp |
| `updatedAt` | `DATE` | Record last update timestamp |

#### Relationships

- **BelongsTo User**: Each attendance record belongs to one user
  ```typescript
  @BelongsTo(() => User)
  user: User;
  ```

#### Constraints

- **Unique Constraint**: `(userId, date)` - Prevents duplicate attendance entries for the same user on the same day
- **Indexes**: 
  - `userId` - For quick lookups by user
  - `date` - For filtering by date
  - Composite unique index on `(userId, date)`

#### Example Entity Structure

```typescript
{
  id: 1,
  userId: 5,
  date: "2024-01-15",
  attendanceTime: "2024-01-15T09:30:00.000Z",
  userLat: 27.4725,
  userLong: 89.6390,
  distanceFromOffice: 125.50,
  createdAt: "2024-01-15T09:30:00.000Z",
  updatedAt: "2024-01-15T09:30:00.000Z"
}
```

---

### 2. DTOs (Data Transfer Objects)

#### 2.1 CreateAttendanceDto

**File**: `src/modules/attendance/dto/create-attendance.dto.ts`

Used for marking attendance. Contains user's device location coordinates.

```typescript
export class CreateAttendanceDto {
  lat: number;   // Latitude (required, must be a number)
  long: number;  // Longitude (required, must be a number)
}
```

**Validation Rules**:
- `lat`: Must be a number, cannot be empty
- `long`: Must be a number, cannot be empty
- Both fields are automatically transformed from string to number

**Example Request Body**:
```json
{
  "lat": 27.4725,
  "long": 89.6390
}
```

---

#### 2.2 AttendanceResponseDto

**File**: `src/modules/attendance/dto/attendance-response.dto.ts`

Response DTO returned when marking attendance successfully.

```typescript
export class AttendanceResponseDto {
  id: number;
  userId: number;
  date: Date;
  attendanceTime: Date;
  userLat: number;
  userLong: number;
  distanceFromOffice: number;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: number;
    name: string;
    emailAddress: string;
    role: string;
  };
}
```

**Example Response**:
```json
{
  "id": 1,
  "userId": 5,
  "date": "2024-01-15",
  "attendanceTime": "2024-01-15T09:30:00.000Z",
  "userLat": 27.4725,
  "userLong": 89.6390,
  "distanceFromOffice": 125.50,
  "createdAt": "2024-01-15T09:30:00.000Z",
  "updatedAt": "2024-01-15T09:30:00.000Z",
  "user": {
    "id": 5,
    "name": "John Doe",
    "emailAddress": "john@example.com",
    "role": "STAFF"
  }
}
```

---

#### 2.3 StaffAttendanceResponseDto

**File**: `src/modules/attendance/dto/staff-attendance-response.dto.ts`

Response DTO for the daily attendance viewer. Contains staff user info and their attendance status.

```typescript
export class StaffAttendanceResponseDto {
  userId: number;
  userName: string;
  userEmail: string;
  attendance?: {
    id: number;
    date: Date;
    attendanceTime: Date;
    distanceFromOffice: number;
  };
}
```

**Example Response**:
```json
[
  {
    "userId": 1,
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "attendance": {
      "id": 1,
      "date": "2024-01-15",
      "attendanceTime": "2024-01-15T09:00:00Z",
      "distanceFromOffice": 125.50
    }
  },
  {
    "userId": 2,
    "userName": "Jane Smith",
    "userEmail": "jane@example.com",
    "attendance": undefined
  }
]
```

**Note**: If `attendance` is `undefined`, it means the staff member has not marked attendance for today.

---

### 3. Service: AttendanceService

**File**: `src/modules/attendance/attendance.service.ts`

#### Dependencies

- `AttendanceRepository`: Sequelize repository for Attendance entity
- `UserRepository`: Sequelize repository for User entity
- `CompanyService`: Service to retrieve office location coordinates

#### Methods

##### 3.1 markAttendance()

**Signature**:
```typescript
async markAttendance(
  userId: number,
  createDto: CreateAttendanceDto,
): Promise<AttendanceResponseDto>
```

**Description**: Marks attendance for a staff user with location validation.

**Process Flow**:
1. Retrieves company office location (lat/long) from CompanyService
2. Validates office location is configured
3. Calculates distance between user location and office using Haversine formula
4. Validates distance is less than 5000 meters
5. Checks if attendance already exists for today
6. If exists, returns existing record (no error)
7. Prevents marking attendance for future dates
8. Creates new attendance record with calculated distance
9. Returns attendance response with user information

**Business Rules**:
- Distance must be **< 5000m** (5km) from office
- Only one attendance record per user per day
- Cannot mark attendance for future dates
- If entry exists, returns existing record without creating duplicate

**Error Cases**:
- `404 NotFoundException`: Office location not configured
- `400 BadRequestException`: Distance >= 5000m ("Please go to the office to mark your attendance")
- `400 BadRequestException`: Attempting to mark future date

**Example Usage**:
```typescript
const createDto = { lat: 27.4725, long: 89.6390 };
const attendance = await attendanceService.markAttendance(userId, createDto);
```

---

##### 3.2 getStaffAttendanceForToday()

**Signature**:
```typescript
async getStaffAttendanceForToday(): Promise<StaffAttendanceResponseDto[]>
```

**Description**: Retrieves all staff users with their attendance status for today.

**Process Flow**:
1. Gets today's date (date only, no time)
2. Fetches all active staff users (role = STAFF, isActive = true)
3. Fetches all attendance records for today
4. Creates a map of userId -> attendance for quick lookup
5. Builds response array combining staff users with their attendance status
6. Returns array sorted by user name

**Response Structure**:
- Returns array of all staff users
- Each entry includes user info (id, name, email)
- If attendance marked: includes attendance details
- If not marked: attendance field is `undefined`

**Example Usage**:
```typescript
const staffAttendance = await attendanceService.getStaffAttendanceForToday();
// Returns array with all staff and their attendance status
```

---

##### 3.3 mapToResponseDto() (Private)

**Signature**:
```typescript
private mapToResponseDto(attendance: Attendance): AttendanceResponseDto
```

**Description**: Maps Attendance entity to AttendanceResponseDto format.

---

### 4. Location Utility

**File**: `src/modules/attendance/utils/location.util.ts`

#### calculateDistance()

**Signature**:
```typescript
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number
```

**Description**: Calculates the distance between two geographic coordinates using the Haversine formula.

**Parameters**:
- `lat1`: Latitude of first point
- `lon1`: Longitude of first point
- `lat2`: Latitude of second point
- `lon2`: Longitude of second point

**Returns**: Distance in meters (number)

**Formula**: Uses Haversine formula to calculate great-circle distance between two points on Earth.

**Example**:
```typescript
const distance = calculateDistance(
  27.4725,  // User latitude
  89.6390,  // User longitude
  27.4710,  // Office latitude
  89.6380   // Office longitude
);
// Returns: 125.50 (meters)
```

---

## Part 2: Frontend Implementation Guide

### 2.1 How to Send Attendance Request by Staff

#### Step 1: Get User's Device Location

Use the browser's Geolocation API to get the user's current location:

```javascript
// Function to get user location
function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          long: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}
```

#### Step 2: Mark Attendance API Call

```javascript
// Function to mark attendance
async function markAttendance() {
  try {
    // Get user's location
    const location = await getUserLocation();
    
    // Prepare request payload
    const payload = {
      lat: location.lat,
      long: location.long,
    };

    // Make API call
    const response = await fetch('http://your-api-url/attendance/mark', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${yourAuthToken}`, // JWT token from login
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to mark attendance');
    }

    const data = await response.json();
    console.log('Attendance marked successfully:', data);
    return data;
  } catch (error) {
    console.error('Error marking attendance:', error);
    // Handle error (show user-friendly message)
    if (error.message.includes('go to the office')) {
      alert('Please go to the office to mark your attendance');
    } else {
      alert('Failed to mark attendance: ' + error.message);
    }
    throw error;
  }
}
```

#### Step 3: React Component Example

```jsx
import React, { useState } from 'react';
import axios from 'axios';

function MarkAttendanceButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleMarkAttendance = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Get user location
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      // Mark attendance
      const response = await axios.post(
        '/attendance/mark',
        {
          lat: position.coords.latitude,
          long: position.coords.longitude,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setMessage('Attendance marked successfully!');
      console.log('Attendance:', response.data);
    } catch (error) {
      if (error.response?.status === 400) {
        setMessage(error.response.data.message || 'Please go to the office to mark your attendance');
      } else if (error.response?.status === 403) {
        setMessage('You do not have permission to mark attendance');
      } else {
        setMessage('Failed to mark attendance. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleMarkAttendance} 
        disabled={loading}
        className="mark-attendance-btn"
      >
        {loading ? 'Marking...' : 'Mark Attendance'}
      </button>
      {message && <p className={message.includes('success') ? 'success' : 'error'}>{message}</p>}
    </div>
  );
}

export default MarkAttendanceButton;
```

#### Error Handling

| Status Code | Error Message | User Action |
|------------|---------------|-------------|
| 400 | "Please go to the office to mark your attendance" | User is too far from office (>5000m) |
| 400 | "Cannot mark attendance for future dates" | Invalid date |
| 403 | Forbidden | User is not STAFF role |
| 404 | "Office location is not configured" | Admin needs to configure office location |

---

### 2.2 How to Construct Attendance Viewer for Admin and Staff

#### Step 1: Fetch Attendance Data

```javascript
// Function to fetch today's attendance
async function getTodayAttendance() {
  try {
    const response = await fetch('http://your-api-url/attendance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${yourAuthToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch attendance');
    }

    const data = await response.json();
    return data; // Array of StaffAttendanceResponseDto
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
}
```

#### Step 2: React Component - Attendance Viewer

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AttendanceViewer() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAttendance();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAttendance, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/attendance', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setAttendance(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load attendance data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusBadge = (attendance) => {
    if (attendance) {
      return (
        <span className="badge badge-success">
          Present
        </span>
      );
    }
    return (
      <span className="badge badge-warning">
        Absent
      </span>
    );
  };

  if (loading) {
    return <div>Loading attendance data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="attendance-viewer">
      <div className="header">
        <h2>Today's Attendance</h2>
        <button onClick={fetchAttendance} className="refresh-btn">
          Refresh
        </button>
      </div>

      <table className="attendance-table">
        <thead>
          <tr>
            <th>Staff Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Time</th>
            <th>Distance</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map((staff) => (
            <tr key={staff.userId}>
              <td>{staff.userName}</td>
              <td>{staff.userEmail}</td>
              <td>{getStatusBadge(staff.attendance)}</td>
              <td>
                {staff.attendance 
                  ? formatTime(staff.attendance.attendanceTime)
                  : 'N/A'
                }
              </td>
              <td>
                {staff.attendance 
                  ? `${staff.attendance.distanceFromOffice.toFixed(2)} m`
                  : 'N/A'
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="summary">
        <p>
          Total Staff: {attendance.length} | 
          Present: {attendance.filter(s => s.attendance).length} | 
          Absent: {attendance.filter(s => !s.attendance).length}
        </p>
      </div>
    </div>
  );
}

export default AttendanceViewer;
```

#### Step 3: CSS Styling Example

```css
.attendance-viewer {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.attendance-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.attendance-table th,
.attendance-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.attendance-table th {
  background-color: #f4f4f4;
  font-weight: bold;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.badge-success {
  background-color: #28a745;
  color: white;
}

.badge-warning {
  background-color: #ffc107;
  color: #333;
}

.summary {
  margin-top: 20px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.refresh-btn {
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.refresh-btn:hover {
  background-color: #0056b3;
}
```

#### Step 4: Enhanced Features (Optional)

**Filter by Status**:
```jsx
const [filter, setFilter] = useState('all'); // 'all', 'present', 'absent'

const filteredAttendance = attendance.filter((staff) => {
  if (filter === 'present') return staff.attendance;
  if (filter === 'absent') return !staff.attendance;
  return true;
});
```

**Search by Name**:
```jsx
const [searchTerm, setSearchTerm] = useState('');

const filteredAttendance = attendance.filter((staff) =>
  staff.userName.toLowerCase().includes(searchTerm.toLowerCase())
);
```

**Export to CSV**:
```jsx
const exportToCSV = () => {
  const csv = [
    ['Name', 'Email', 'Status', 'Time', 'Distance'],
    ...attendance.map(s => [
      s.userName,
      s.userEmail,
      s.attendance ? 'Present' : 'Absent',
      s.attendance ? formatTime(s.attendance.attendanceTime) : 'N/A',
      s.attendance ? s.attendance.distanceFromOffice.toFixed(2) : 'N/A',
    ]),
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
};
```

---

## API Endpoints Summary

### POST `/attendance/mark`
- **Access**: STAFF only
- **Body**: `{ lat: number, long: number }`
- **Response**: `AttendanceResponseDto`
- **Errors**: 
  - 400: Location too far or invalid date
  - 403: Not STAFF role
  - 404: Office location not configured

### GET `/attendance`
- **Access**: STAFF and ADMIN
- **Response**: `StaffAttendanceResponseDto[]`
- **Description**: Returns all staff users with today's attendance status

---

## Database Schema

```sql
CREATE TABLE attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  date DATE NOT NULL,
  attendanceTime DATETIME NOT NULL,
  userLat DOUBLE NOT NULL,
  userLong DOUBLE NOT NULL,
  distanceFromOffice DOUBLE NOT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id),
  UNIQUE KEY unique_user_date (userId, date),
  INDEX idx_userId (userId),
  INDEX idx_date (date)
);
```

---

## Notes

1. **Location Validation**: Uses Haversine formula for accurate distance calculation
2. **Duplicate Prevention**: Unique constraint on (userId, date) prevents duplicates
3. **Distance Threshold**: 5000 meters (5km) from office location
4. **Date Handling**: Uses DATEONLY for date field, stores only date without time
5. **Timezone**: All times are stored in UTC, convert to local timezone in frontend
6. **Office Location**: Must be configured in Company entity (lat, long fields)

---

## Testing Checklist

- [ ] Mark attendance within 5000m radius
- [ ] Attempt to mark attendance outside 5000m radius
- [ ] Mark attendance twice on same day (should return existing)
- [ ] View attendance as STAFF user
- [ ] View attendance as ADMIN user
- [ ] Test with office location not configured
- [ ] Test with invalid coordinates
- [ ] Test with future date (should fail)
