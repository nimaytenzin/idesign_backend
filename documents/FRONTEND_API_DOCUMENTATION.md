# Frontend API Documentation - Angular Integration Guide

## Table of Contents
1. [Base URL](#base-url)
2. [Authentication](#authentication)
3. [Analytics Module](#analytics-module)
4. [Order Module](#order-module)
5. [Analytics Dashboard Metrics](#analytics-dashboard-metrics)


```

---

## Authentication

All protected endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Analytics Module

### Base Path
```
/analytics
```

### Endpoints

#### 1. Track Visitor (Manual)
**POST** `/analytics/track`

Manually track a visitor (optional - automatic tracking is enabled via interceptor).

**Request Body:**
```typescript
{
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  orderId?: number;
}
```

**Response:**
```typescript
{
  message: string; // "Visitor tracked successfully"
}
```

---

#### 2. Get Visitor Statistics
**GET** `/analytics/stats`

Get comprehensive visitor statistics with optional filters.

**Query Parameters:**
```typescript
{
  startDate?: string;      // ISO 8601 format: "2024-01-01T00:00:00Z"
  endDate?: string;        // ISO 8601 format: "2024-12-31T23:59:59Z"
  country?: string;        // Filter by country code (e.g., "BT", "US")
  district?: string;       // Filter by district name
  deviceType?: string;     // "MOBILE" | "TABLET" | "COMPUTER" | "UNKNOWN"
  referrerSource?: string; // "SEARCH_ENGINE" | "SOCIAL_MEDIA" | "DIRECT" | "OTHER" | "UNKNOWN"
}
```

**Response:**
```typescript
{
  totalVisitors: number;
  uniqueVisitors: number;
  visitorsByCountry: Array<{
    country: string;
    count: number;
  }>;
  visitorsByDevice: Array<{
    deviceType: "MOBILE" | "TABLET" | "COMPUTER" | "UNKNOWN";
    count: number;
  }>;
  visitorsByReferrer: Array<{
    referrerSource: "SEARCH_ENGINE" | "SOCIAL_MEDIA" | "DIRECT" | "OTHER" | "UNKNOWN";
    count: number;
  }>;
  visitorsByDistrict: Array<{
    country: string;
    district: string;
    count: number;
  }>;
}
```

**Example Request:**
```
GET /analytics/stats?startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z&country=BT
```

---

#### 3. Get Visitors by Country
**GET** `/analytics/visitors/by-country`

Get visitor count grouped by country.

**Query Parameters:** (Same as stats endpoint)

**Response:**
```typescript
Array<{
  country: string;
  count: number;
}>
```

**Example Response:**
```json
[
  { "country": "BT", "count": 1250 },
  { "country": "IN", "count": 850 },
  { "country": "US", "count": 420 }
]
```

---

#### 4. Get Visitors by Device Type
**GET** `/analytics/visitors/by-device`

Get visitor count grouped by device type.

**Query Parameters:** (Same as stats endpoint)

**Response:**
```typescript
Array<{
  deviceType: "MOBILE" | "TABLET" | "COMPUTER" | "UNKNOWN";
  count: number;
}>
```

**Example Response:**
```json
[
  { "deviceType": "MOBILE", "count": 1800 },
  { "deviceType": "COMPUTER", "count": 650 },
  { "deviceType": "TABLET", "count": 70 }
]
```

---

#### 5. Get Visitors by Referrer Source
**GET** `/analytics/visitors/by-referrer`

Get visitor count grouped by referrer source.

**Query Parameters:** (Same as stats endpoint)

**Response:**
```typescript
Array<{
  referrerSource: "SEARCH_ENGINE" | "SOCIAL_MEDIA" | "DIRECT" | "OTHER" | "UNKNOWN";
  count: number;
}>
```

**Example Response:**
```json
[
  { "referrerSource": "DIRECT", "count": 1200 },
  { "referrerSource": "SEARCH_ENGINE", "count": 800 },
  { "referrerSource": "SOCIAL_MEDIA", "count": 420 },
  { "referrerSource": "OTHER", "count": 100 }
]
```

---

#### 6. Get Visitors by District
**GET** `/analytics/visitors/by-district`

Get visitor count grouped by district within countries.

**Query Parameters:**
```typescript
{
  country?: string;        // Optional: Filter by country code
  startDate?: string;
  endDate?: string;
  // ... other filters
}
```

**Response:**
```typescript
Array<{
  country: string;
  district: string;
  count: number;
}>
```

**Example Response:**
```json
[
  { "country": "BT", "district": "Thimphu", "count": 850 },
  { "country": "BT", "district": "Paro", "count": 400 },
  { "country": "IN", "district": "Delhi", "count": 650 }
]
```

---

#### 7. Get Visitors List (Paginated)
**GET** `/analytics/visitors`

Get paginated list of individual visitor records.

**Query Parameters:**
```typescript
{
  startDate?: string;
  endDate?: string;
  country?: string;
  district?: string;
  deviceType?: string;
  referrerSource?: string;
  page?: number;           // Default: 1
  limit?: number;          // Default: 50, Max: 100
}
```

**Response:**
```typescript
{
  data: Array<{
    id: number;
    sessionId: string;
    ipAddress: string;
    country: string | null;
    district: string | null;
    deviceType: "MOBILE" | "TABLET" | "COMPUTER" | "UNKNOWN";
    referrer: string | null;
    referrerSource: "SEARCH_ENGINE" | "SOCIAL_MEDIA" | "DIRECT" | "OTHER" | "UNKNOWN";
    userAgent: string | null;
    visitedAt: string;     // ISO 8601 date string
    orderId: number | null;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

### Enums Reference

#### DeviceType
```typescript
enum DeviceType {
  MOBILE = "MOBILE",
  TABLET = "TABLET",
  COMPUTER = "COMPUTER",
  UNKNOWN = "UNKNOWN"
}
```

#### ReferrerSource
```typescript
enum ReferrerSource {
  SEARCH_ENGINE = "SEARCH_ENGINE",
  SOCIAL_MEDIA = "SOCIAL_MEDIA",
  DIRECT = "DIRECT",
  OTHER = "OTHER",
  UNKNOWN = "UNKNOWN"
}
```

---

## Order Module

### Base Path
```
/orders
```

### Relevant Endpoints for Analytics

#### Create Order
**POST** `/orders`

Create a new order. Referrer source is automatically captured from request headers.

**Request Body:**
```typescript
{
  customer: {
    name?: string;
    email?: string;
    phoneNumber?: string;
    shippingAddress?: string;
    billingAddress?: string;
  };
  orderLineItems: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
    discountApplied?: number;
  }>;
  paymentMethod?: "CASH" | "MBOB" | "BDB_EPAY" | "TPAY" | "BNB_MPAY" | "ZPSS";
  shippingCost?: number;
  internalNotes?: string;
  referrerSource?: string;  // Optional: Will be auto-captured from headers if not provided
}
```

**Response:**
```typescript
{
  id: number;
  orderNumber: string;
  customerId: number;
  orderDate: string;
  totalAmount: number;
  fulfillmentStatus: string;
  paymentStatus: string;
  referrerSource: string | null;  // Captured referrer source
  // ... other order fields
}
```

---

## Analytics Dashboard Metrics

### Recommended Dashboard Layout

#### 1. Overview Cards (Top Row)

Display key metrics in card format:

```typescript
interface OverviewMetrics {
  totalVisitors: number;           // Total visitor count
  uniqueVisitors: number;          // Unique session count
  conversionRate: number;          // (Orders / Visitors) * 100
  averageSessionDuration: number;  // If tracked separately
}
```

**API Call:**
```
GET /analytics/stats?startDate={startDate}&endDate={endDate}
```

Use:
- `totalVisitors` → Total Visitors Card
- `uniqueVisitors` → Unique Visitors Card
- Calculate conversion rate from orders API

---

#### 2. Visitors by Country Chart

**Chart Type:** Bar Chart or Map Visualization

**Data Source:**
```
GET /analytics/visitors/by-country?startDate={startDate}&endDate={endDate}
```

**Chart Data Structure:**
```typescript
{
  labels: string[];      // Country codes or names
  values: number[];      // Visitor counts
  data: Array<{
    country: string;
    count: number;
  }>;
}
```

**Display:**
- X-axis: Country names
- Y-axis: Visitor count
- Sort by count (descending)
- Top 10 countries recommended

---

#### 3. Visitors by Device Type Chart

**Chart Type:** Pie Chart or Donut Chart

**Data Source:**
```
GET /analytics/visitors/by-device?startDate={startDate}&endDate={endDate}
```

**Chart Data Structure:**
```typescript
{
  labels: string[];      // ["MOBILE", "COMPUTER", "TABLET", "UNKNOWN"]
  values: number[];      // Corresponding counts
  colors: string[];      // ["#3b82f6", "#10b981", "#f59e0b", "#6b7280"]
}
```

**Display:**
- Show percentages
- Highlight largest segment
- Include legend

---

#### 4. Visitors by Referrer Source Chart

**Chart Type:** Horizontal Bar Chart or Stacked Bar Chart

**Data Source:**
```
GET /analytics/visitors/by-referrer?startDate={startDate}&endDate={endDate}
```

**Chart Data Structure:**
```typescript
{
  labels: string[];      // ["DIRECT", "SEARCH_ENGINE", "SOCIAL_MEDIA", "OTHER"]
  values: number[];      // Corresponding counts
  colors: {
    DIRECT: "#3b82f6",
    SEARCH_ENGINE: "#10b981",
    SOCIAL_MEDIA: "#f59e0b",
    OTHER: "#6b7280",
    UNKNOWN: "#9ca3af"
  }
}
```

**Display:**
- Sort by count (descending)
- Show both count and percentage
- Color-code by referrer type

---

#### 5. Visitors by District (Table/Map)

**Data Source:**
```
GET /analytics/visitors/by-district?country={country}&startDate={startDate}&endDate={endDate}
```

**Display Options:**
- **Table View:** Sortable table with Country, District, Count columns
- **Map View:** Interactive map showing districts with visitor counts
- **Filter by Country:** Allow user to filter by specific country

---

#### 6. Visitor Trends Over Time (Line Chart)

**Implementation Note:** 
Requires aggregating visitor data by date. Consider adding a new endpoint for time-series data, or aggregate client-side from the visitors list endpoint.

**Suggested Data Structure:**
```typescript
{
  dates: string[];       // ["2024-01-01", "2024-01-02", ...]
  visitors: number[];    // [120, 150, 180, ...]
  uniqueVisitors: number[]; // [100, 130, 160, ...]
}
```

---

#### 7. Recent Visitors Table

**Data Source:**
```
GET /analytics/visitors?page=1&limit=50&startDate={startDate}&endDate={endDate}
```

**Table Columns:**
- Date/Time (visitedAt)
- Country
- District
- Device Type
- Referrer Source
- IP Address (optional, for admin view)
- Order ID (if linked to an order)

**Features:**
- Pagination
- Sortable columns
- Filters (country, device, referrer)
- Export to CSV option

---

### Dashboard Filter Options

Provide filter controls for:

```typescript
interface DashboardFilters {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  country?: string;              // Dropdown selector
  deviceType?: DeviceType;       // Multi-select checkbox
  referrerSource?: ReferrerSource; // Multi-select checkbox
}
```

**Default Filters:**
- Date Range: Last 30 days
- All countries
- All device types
- All referrer sources

---

### Sample Service Implementation (TypeScript Interfaces)

```typescript
// analytics.service.ts (Angular Service)

export interface VisitorStats {
  totalVisitors: number;
  uniqueVisitors: number;
  visitorsByCountry: CountryStats[];
  visitorsByDevice: DeviceStats[];
  visitorsByReferrer: ReferrerStats[];
  visitorsByDistrict: DistrictStats[];
}

export interface CountryStats {
  country: string;
  count: number;
}

export interface DeviceStats {
  deviceType: 'MOBILE' | 'TABLET' | 'COMPUTER' | 'UNKNOWN';
  count: number;
}

export interface ReferrerStats {
  referrerSource: 'SEARCH_ENGINE' | 'SOCIAL_MEDIA' | 'DIRECT' | 'OTHER' | 'UNKNOWN';
  count: number;
}

export interface DistrictStats {
  country: string;
  district: string;
  count: number;
}

export interface VisitorRecord {
  id: number;
  sessionId: string;
  ipAddress: string;
  country: string | null;
  district: string | null;
  deviceType: string;
  referrer: string | null;
  referrerSource: string;
  userAgent: string | null;
  visitedAt: string;
  orderId: number | null;
}

export interface VisitorsResponse {
  data: VisitorRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
  country?: string;
  district?: string;
  deviceType?: string;
  referrerSource?: string;
  page?: number;
  limit?: number;
}

// Service methods
class AnalyticsService {
  getVisitorStats(params?: AnalyticsQueryParams): Observable<VisitorStats>
  getVisitorsByCountry(params?: AnalyticsQueryParams): Observable<CountryStats[]>
  getVisitorsByDevice(params?: AnalyticsQueryParams): Observable<DeviceStats[]>
  getVisitorsByReferrer(params?: AnalyticsQueryParams): Observable<ReferrerStats[]>
  getVisitorsByDistrict(country?: string, params?: AnalyticsQueryParams): Observable<DistrictStats[]>
  getVisitors(params?: AnalyticsQueryParams): Observable<VisitorsResponse>
}
```

---

### Date Range Presets

Provide quick-select options for date ranges:

```typescript
enum DateRangePreset {
  TODAY = "today",
  YESTERDAY = "yesterday",
  LAST_7_DAYS = "last7days",
  LAST_30_DAYS = "last30days",
  THIS_MONTH = "thisMonth",
  LAST_MONTH = "lastMonth",
  THIS_YEAR = "thisYear",
  CUSTOM = "custom"
}
```

---

### Error Handling

All endpoints return standard HTTP status codes:

- `200 OK` - Success
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Missing or invalid JWT token
- `500 Internal Server Error` - Server error

**Error Response Format:**
```typescript
{
  statusCode: number;
  message: string | string[];
  error?: string;
}
```

---

### Rate Limiting

Consider implementing rate limiting on the frontend to avoid excessive API calls:

- Cache statistics for 5-10 minutes
- Debounce filter changes before making API calls
- Use pagination for visitor lists instead of loading all records

---

### Chart Library Recommendations

Recommended Angular chart libraries:

1. **ng2-charts** (Chart.js wrapper) - Good for bar, line, pie charts
2. **ngx-charts** - Advanced charts with animations
3. **Chart.js** with Angular - Direct integration
4. **D3.js** - For custom visualizations and maps

---

### Example API Service Calls

```typescript
// Get overall stats for last 30 days
const startDate = new Date();
startDate.setDate(startDate.getDate() - 30);
const endDate = new Date();

GET /analytics/stats?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}

// Get mobile visitors from Bhutan
GET /analytics/visitors/by-device?deviceType=MOBILE&country=BT

// Get visitors from Thimphu district
GET /analytics/visitors/by-district?country=BT&district=Thimphu

// Get paginated visitor list
GET /analytics/visitors?page=1&limit=50&startDate=2024-01-01T00:00:00Z
```

---

## Additional Notes

1. **Automatic Tracking:** Visitor tracking happens automatically via interceptor - no frontend code needed
2. **Referrer Capture:** Referrer is automatically captured when orders are created
3. **Timezone:** All dates are in UTC - convert to local timezone on frontend
4. **Data Freshness:** Analytics data is real-time, but consider caching for performance
5. **Privacy:** Consider GDPR/privacy compliance for IP address storage and display

---

## Support

For API issues or questions, contact the backend development team.

