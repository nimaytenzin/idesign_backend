# Affiliate Marketer API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [User Roles](#user-roles)
5. [Endpoints](#endpoints)
   - [Commission Summary](#commission-summary)
   - [Statistics](#statistics)
   - [Monthly Reports](#monthly-reports)
6. [Data Models](#data-models)
7. [Error Responses](#error-responses)
8. [Frontend Integration Examples](#frontend-integration-examples)
9. [TypeScript Service Example](#typescript-service-example)

---

## Overview

The Affiliate Marketer API provides read-only endpoints for affiliate marketers to view their commission earnings, sales statistics, and monthly reports. Affiliate marketers can track their performance, view products sold, and monitor their earnings over time.

### Key Features
- View total commission earned across all orders
- View comprehensive statistics including total orders, amount sold, and products sold
- Generate monthly reports with commission and sales breakdowns
- Product-level tracking (products sold by ID, quantity, and amount)
- Read-only access - affiliates cannot create or update data
- Automatic commission calculation when orders use affiliate voucher codes

### How It Works
1. Affiliate marketers are users with role `AFFILIATE_MARKETER`
2. Each affiliate has a unique `voucherCode` that customers can use during checkout
3. When an order is placed using an affiliate's voucher code:
   - Commission is calculated based on order total **before discounts**
   - Commission percentage is set per affiliate (separate from customer discount percentage)
   - An `AffiliateCommission` record is automatically created
4. Affiliates can view their earnings and statistics through the API endpoints

---

## Base URL

```
/api/affiliate
```

All endpoints are prefixed with `/affiliate`.

---

## Authentication

All endpoints in this API require:
1. **JWT Authentication** - Valid JWT token must be provided in the Authorization header
2. **AFFILIATE_MARKETER Role** - Only users with `AFFILIATE_MARKETER` role can access these endpoints

**Authorization Header Format:**
```
Authorization: Bearer <your_jwt_token>
```

**Important:** Affiliates can only view their own data. The system automatically filters results based on the authenticated user's ID.

---

## User Roles

The system supports the following role for affiliate access:

- **AFFILIATE_MARKETER** - Read-only access to own commission and sales data

**Note:** Admin users can manage affiliate accounts (create, update affiliate users with voucher codes, discount percentages, and commission percentages) through the standard user management endpoints, but this documentation focuses on the affiliate-facing read-only endpoints.

---

## Endpoints

### Commission Summary

Get the total commission earned, total orders, and total amount sold.

**Endpoint:** `GET /affiliate/commission`

**Authentication:** Required (AFFILIATE_MARKETER role)

**Request:** No query parameters or request body required.

**Success Response:** `200 OK`
```json
{
  "totalCommission": 1250.50,
  "totalOrders": 45,
  "totalAmountSold": 25010.00
}
```

**Response Schema:**
| Field | Type | Description |
|-------|------|-------------|
| `totalCommission` | number | Total commission earned across all orders (in currency units) |
| `totalOrders` | number | Total number of orders that used the affiliate's voucher code |
| `totalAmountSold` | number | Total order value before discounts (in currency units) |

**Example Request:**
```typescript
const response = await fetch('/api/affiliate/commission', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(`Total Commission: $${data.totalCommission}`);
console.log(`Total Orders: ${data.totalOrders}`);
console.log(`Total Amount Sold: $${data.totalAmountSold}`);
```

---

### Statistics

Get comprehensive statistics including products sold with details.

**Endpoint:** `GET /affiliate/stats`

**Authentication:** Required (AFFILIATE_MARKETER role)

**Request:** No query parameters or request body required.

**Success Response:** `200 OK`
```json
{
  "totalOrders": 45,
  "totalAmountSold": 25010.00,
  "totalCommission": 1250.50,
  "productsSold": [
    {
      "productId": 1,
      "productName": "Premium Chair",
      "quantity": 15,
      "totalAmount": 4500.00
    },
    {
      "productId": 2,
      "productName": "Office Desk",
      "quantity": 8,
      "totalAmount": 3200.00
    },
    {
      "productId": 5,
      "productName": "Ergonomic Keyboard",
      "quantity": 22,
      "totalAmount": 1100.00
    }
  ]
}
```

**Response Schema:**
| Field | Type | Description |
|-------|------|-------------|
| `totalOrders` | number | Total number of orders |
| `totalAmountSold` | number | Total order value before discounts |
| `totalCommission` | number | Total commission earned |
| `productsSold` | array | Array of products sold (aggregated) |
| `productsSold[].productId` | number | Product ID |
| `productsSold[].productName` | string \| undefined | Product name (if available) |
| `productsSold[].quantity` | number | Total quantity of this product sold |
| `productsSold[].totalAmount` | number | Total amount for this product (after discounts) |

**Example Request:**
```typescript
const response = await fetch('/api/affiliate/stats', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(`Total Orders: ${data.totalOrders}`);
console.log(`Total Commission: $${data.totalCommission}`);

data.productsSold.forEach(product => {
  console.log(`${product.productName}: ${product.quantity} units, $${product.totalAmount}`);
});
```

---

### Monthly Reports

Get detailed monthly commission and sales report.

**Endpoint:** `GET /affiliate/reports/monthly`

**Authentication:** Required (AFFILIATE_MARKETER role)

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `month` | number | No | Current month | Month (1-12) |
| `year` | number | No | Current year | Year (e.g., 2024) |

**Success Response:** `200 OK`
```json
{
  "month": 3,
  "year": 2024,
  "totalCommission": 450.75,
  "totalAmountSold": 9015.00,
  "totalOrders": 12,
  "productsSold": [
    {
      "productId": 1,
      "productName": "Premium Chair",
      "quantity": 5,
      "totalAmount": 1500.00
    },
    {
      "productId": 2,
      "productName": "Office Desk",
      "quantity": 3,
      "totalAmount": 1200.00
    }
  ]
}
```

**Response Schema:**
| Field | Type | Description |
|-------|------|-------------|
| `month` | number | Month number (1-12) |
| `year` | number | Year |
| `totalCommission` | number | Commission earned in this month |
| `totalAmountSold` | number | Total order value before discounts in this month |
| `totalOrders` | number | Number of orders in this month |
| `productsSold` | array | Products sold in this month (same structure as stats endpoint) |

**Example Requests:**

**Get current month's report:**
```typescript
const response = await fetch('/api/affiliate/reports/monthly', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
```

**Get specific month's report:**
```typescript
const month = 2; // February
const year = 2024;

const response = await fetch(
  `/api/affiliate/reports/monthly?month=${month}&year=${year}`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
console.log(`March ${data.year} Report:`);
console.log(`Commission: $${data.totalCommission}`);
console.log(`Orders: ${data.totalOrders}`);
```

---

## Data Models

### AffiliateCommissionResponseDto
```typescript
interface AffiliateCommissionResponseDto {
  totalCommission: number;
  totalOrders: number;
  totalAmountSold: number;
}
```

### ProductSoldDto
```typescript
interface ProductSoldDto {
  productId: number;
  productName?: string;
  quantity: number;
  totalAmount: number;
}
```

### AffiliateStatsResponseDto
```typescript
interface AffiliateStatsResponseDto {
  totalOrders: number;
  totalAmountSold: number;
  totalCommission: number;
  productsSold: ProductSoldDto[];
}
```

### MonthlyReportQueryDto
```typescript
interface MonthlyReportQueryDto {
  month?: number;  // 1-12, optional, defaults to current month
  year?: number;    // e.g., 2024, optional, defaults to current year
}
```

### MonthlyReportResponseDto
```typescript
interface MonthlyReportResponseDto {
  month: number;
  year: number;
  totalCommission: number;
  totalAmountSold: number;
  totalOrders: number;
  productsSold: ProductSoldMonthlyDto[];
}

interface ProductSoldMonthlyDto {
  productId: number;
  productName?: string;
  quantity: number;
  totalAmount: number;
}
```

---

## Error Responses

### 401 Unauthorized
Returned when:
- No authentication token provided
- Invalid or expired token
- User does not have AFFILIATE_MARKETER role

**Response:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
Returned when user does not have the required role.

**Response:**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### 400 Bad Request
Returned when query parameters are invalid (e.g., month not in 1-12 range).

**Response:**
```json
{
  "statusCode": 400,
  "message": ["month must be a number conforming to the specified constraints"],
  "error": "Bad Request"
}
```

### 500 Internal Server Error
Returned when an unexpected server error occurs.

**Response:**
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Frontend Integration Examples

### React Example

```typescript
import { useState, useEffect } from 'react';

interface AffiliateStats {
  totalOrders: number;
  totalAmountSold: number;
  totalCommission: number;
  productsSold: Array<{
    productId: number;
    productName?: string;
    quantity: number;
    totalAmount: number;
  }>;
}

function AffiliateDashboard() {
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/affiliate/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!stats) return null;

  return (
    <div>
      <h1>Affiliate Dashboard</h1>
      <div>
        <h2>Summary</h2>
        <p>Total Orders: {stats.totalOrders}</p>
        <p>Total Amount Sold: ${stats.totalAmountSold.toFixed(2)}</p>
        <p>Total Commission: ${stats.totalCommission.toFixed(2)}</p>
      </div>
      <div>
        <h2>Products Sold</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {stats.productsSold.map(product => (
              <tr key={product.productId}>
                <td>{product.productName || `Product #${product.productId}`}</td>
                <td>{product.quantity}</td>
                <td>${product.totalAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### Vue.js Example

```vue
<template>
  <div class="affiliate-dashboard">
    <h1>Affiliate Dashboard</h1>
    
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else>
      <div class="summary">
        <h2>Summary</h2>
        <p>Total Orders: {{ stats.totalOrders }}</p>
        <p>Total Amount Sold: ${{ stats.totalAmountSold.toFixed(2) }}</p>
        <p>Total Commission: ${{ stats.totalCommission.toFixed(2) }}</p>
      </div>
      
      <div class="products">
        <h2>Products Sold</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in stats.productsSold" :key="product.productId">
              <td>{{ product.productName || `Product #${product.productId}` }}</td>
              <td>{{ product.quantity }}</td>
              <td>${{ product.totalAmount.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface ProductSold {
  productId: number;
  productName?: string;
  quantity: number;
  totalAmount: number;
}

interface AffiliateStats {
  totalOrders: number;
  totalAmountSold: number;
  totalCommission: number;
  productsSold: ProductSold[];
}

const stats = ref<AffiliateStats | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const fetchStats = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/affiliate/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }

    const data = await response.json();
    stats.value = data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStats();
});
</script>
```

### Monthly Report Component Example

```typescript
import { useState } from 'react';

function MonthlyReport() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `/api/affiliate/reports/monthly?month=${month}&year=${year}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Monthly Report</h2>
      <div>
        <label>
          Month:
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        <label>
          Year:
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min="2020"
            max="2030"
          />
        </label>
        <button onClick={fetchReport} disabled={loading}>
          {loading ? 'Loading...' : 'Get Report'}
        </button>
      </div>

      {report && (
        <div>
          <h3>Report for {report.month}/{report.year}</h3>
          <p>Total Commission: ${report.totalCommission.toFixed(2)}</p>
          <p>Total Amount Sold: ${report.totalAmountSold.toFixed(2)}</p>
          <p>Total Orders: {report.totalOrders}</p>
          <h4>Products Sold:</h4>
          <ul>
            {report.productsSold.map(product => (
              <li key={product.productId}>
                {product.productName || `Product #${product.productId}`}: 
                {product.quantity} units, ${product.totalAmount.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## TypeScript Service Example

Here's a complete TypeScript service class for interacting with the Affiliate API:

```typescript
// affiliate.service.ts

export interface AffiliateCommissionResponse {
  totalCommission: number;
  totalOrders: number;
  totalAmountSold: number;
}

export interface ProductSold {
  productId: number;
  productName?: string;
  quantity: number;
  totalAmount: number;
}

export interface AffiliateStatsResponse {
  totalOrders: number;
  totalAmountSold: number;
  totalCommission: number;
  productsSold: ProductSold[];
}

export interface MonthlyReportQuery {
  month?: number;
  year?: number;
}

export interface MonthlyReportResponse {
  month: number;
  year: number;
  totalCommission: number;
  totalAmountSold: number;
  totalOrders: number;
  productsSold: ProductSold[];
}

export class AffiliateService {
  private baseUrl = '/api/affiliate';
  private token: string | null = null;

  constructor(token?: string) {
    this.token = token || localStorage.getItem('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get total commission earned, total orders, and total amount sold
   */
  async getTotalCommission(): Promise<AffiliateCommissionResponse> {
    return this.request<AffiliateCommissionResponse>('/commission');
  }

  /**
   * Get comprehensive statistics including products sold
   */
  async getStats(): Promise<AffiliateStatsResponse> {
    return this.request<AffiliateStatsResponse>('/stats');
  }

  /**
   * Get monthly commission and sales report
   * @param month Optional month (1-12), defaults to current month
   * @param year Optional year, defaults to current year
   */
  async getMonthlyReport(
    month?: number,
    year?: number
  ): Promise<MonthlyReportResponse> {
    const params = new URLSearchParams();
    if (month !== undefined) params.append('month', month.toString());
    if (year !== undefined) params.append('year', year.toString());

    const queryString = params.toString();
    const endpoint = `/reports/monthly${queryString ? `?${queryString}` : ''}`;

    return this.request<MonthlyReportResponse>(endpoint);
  }
}

// Usage example:
// const affiliateService = new AffiliateService();
// const commission = await affiliateService.getTotalCommission();
// const stats = await affiliateService.getStats();
// const report = await affiliateService.getMonthlyReport(3, 2024);
```

---

## Important Notes

### Commission Calculation
- Commissions are calculated based on the **order total BEFORE any discounts are applied**
- This includes the sum of all item prices (quantity × unitPrice) + shipping cost
- The commission percentage is set per affiliate and is separate from the customer discount percentage

### Data Filtering
- All endpoints automatically filter data to show only the authenticated affiliate's information
- Affiliates cannot view other affiliates' data
- The system uses the JWT token to identify the affiliate

### Voucher Code Usage
- When a customer uses an affiliate's voucher code during checkout, a commission record is automatically created
- The affiliate's discount percentage applies to the customer (customer gets a discount)
- The affiliate's commission percentage determines their earnings (calculated on pre-discount total)

### Read-Only Access
- All endpoints are read-only
- Affiliates cannot create, update, or delete any data through these endpoints
- To update affiliate information (voucher code, percentages), use the admin user management endpoints

### Product Information
- Product names may be `undefined` if the product has been deleted or is not available
- Always check for `productName` existence before displaying
- Use `productId` as a fallback identifier

---

## Support

For issues or questions regarding the Affiliate Marketer API, please contact the development team or refer to the main API documentation.

