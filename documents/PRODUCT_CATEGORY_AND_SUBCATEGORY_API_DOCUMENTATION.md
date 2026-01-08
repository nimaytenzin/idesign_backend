# Product Category and Subcategory API Documentation

## Table of Contents
1. [Product Category API](#product-category-api)
2. [Product Subcategory API](#product-subcategory-api)

---

# Product Category API

## Overview
Product Categories are top-level classifications for products. Each category can have multiple subcategories, and products are assigned to subcategories.

**Base URL**: `/product-categories`

---

## Create Product Category

### Endpoint
```
POST /product-categories
```

### Request Headers
```
Content-Type: application/json
```

### Request Body

#### Required Fields
- `name` (string, required): Category name (must be unique)

#### Optional Fields
- `description` (string, optional): Category description
- `isActive` (boolean, optional): Whether the category is active (defaults to `true`)

### Example Request

```json
{
  "name": "Furniture",
  "description": "All types of furniture items",
  "isActive": true
}
```

### Response

#### Success Response (201 Created)
```json
{
  "id": 1,
  "name": "Furniture",
  "description": "All types of furniture items",
  "isActive": true,
  "createdAt": "2026-01-08T10:00:00.000Z",
  "updatedAt": "2026-01-08T10:00:00.000Z"
}
```

#### Error Response (409 Conflict)
```json
{
  "statusCode": 409,
  "message": "A category with this name already exists",
  "error": "Conflict"
}
```

---

## Get All Product Categories

### Endpoint
```
GET /product-categories
```

### Query Parameters
- `includeInactive` (string, optional): Set to `"true"` to include inactive categories. Default: only active categories are returned.

### Response

#### Success Response (200 OK)
```json
[
  {
    "id": 1,
    "name": "Furniture",
    "description": "All types of furniture items",
    "isActive": true,
    "subCategories": [
      {
        "id": 1,
        "name": "Chairs",
        "description": "Various types of chairs",
        "isActive": true
      },
      {
        "id": 2,
        "name": "Tables",
        "description": "Dining and coffee tables",
        "isActive": true
      }
    ],
    "createdAt": "2026-01-08T10:00:00.000Z",
    "updatedAt": "2026-01-08T10:00:00.000Z"
  }
]
```

### Example Usage

**Get only active categories:**
```
GET /product-categories
```

**Get all categories including inactive:**
```
GET /product-categories?includeInactive=true
```

---

## Get Single Product Category

### Endpoint
```
GET /product-categories/:id
```

### Path Parameters
- `id` (number, required): Category ID

### Response

#### Success Response (200 OK)
```json
{
  "id": 1,
  "name": "Furniture",
  "description": "All types of furniture items",
  "isActive": true,
  "subCategories": [
    {
      "id": 1,
      "name": "Chairs",
      "description": "Various types of chairs",
      "isActive": true,
      "productCategoryId": 1
    }
  ],
  "createdAt": "2026-01-08T10:00:00.000Z",
  "updatedAt": "2026-01-08T10:00:00.000Z"
}
```

#### Error Response (404 Not Found)
```json
{
  "statusCode": 404,
  "message": "Product category not found",
  "error": "Not Found"
}
```

---

## Update Product Category

### Endpoint
```
PATCH /product-categories/:id
```

### Path Parameters
- `id` (number, required): Category ID

### Request Body

All fields are optional. Only include fields you want to update.

- `name` (string, optional): Category name (must be unique if provided)
- `description` (string, optional): Category description
- `isActive` (boolean, optional): Whether the category is active

### Example Request

```json
{
  "name": "Home Furniture",
  "description": "Updated description"
}
```

### Response

#### Success Response (200 OK)
```json
{
  "id": 1,
  "name": "Home Furniture",
  "description": "Updated description",
  "isActive": true,
  "subCategories": [
    {
      "id": 1,
      "name": "Chairs",
      "isActive": true
    }
  ],
  "createdAt": "2026-01-08T10:00:00.000Z",
  "updatedAt": "2026-01-08T11:00:00.000Z"
}
```

#### Error Response (409 Conflict)
```json
{
  "statusCode": 409,
  "message": "A category with this name already exists",
  "error": "Conflict"
}
```

---

## Toggle Category Status

### Endpoint
```
PATCH /product-categories/:id/toggle-status
```

### Path Parameters
- `id` (number, required): Category ID

### Description
Toggles the `isActive` status of a category (active ↔ inactive).

### Response

#### Success Response (200 OK)
```json
{
  "id": 1,
  "name": "Furniture",
  "description": "All types of furniture items",
  "isActive": false,
  "subCategories": [],
  "createdAt": "2026-01-08T10:00:00.000Z",
  "updatedAt": "2026-01-08T12:00:00.000Z"
}
```

---

## Delete Product Category

### Endpoint
```
DELETE /product-categories/:id
```

### Path Parameters
- `id` (number, required): Category ID

### Description
Deletes a product category. **Important**: The category cannot be deleted if:
1. It has subcategories, OR
2. Any of its subcategories have products associated with them

### Response

#### Success Response (200 OK)
No response body. The category is deleted successfully.

#### Error Response (409 Conflict - Has Subcategories)
```json
{
  "statusCode": 409,
  "message": "Cannot delete category that has subcategories. Remove subcategories first.",
  "error": "Conflict"
}
```

#### Error Response (409 Conflict - Has Products)
```json
{
  "statusCode": 409,
  "message": "Cannot delete category that has subcategories with products. Please delete or reassign products in subcategory \"Chairs\" first.",
  "error": "Conflict"
}
```

#### Error Response (404 Not Found)
```json
{
  "statusCode": 404,
  "message": "Product category not found",
  "error": "Not Found"
}
```

### Deletion Rules

1. **Check for Subcategories**: The category must not have any subcategories
2. **Check for Products**: Even if subcategories exist, if any subcategory has products, deletion is blocked
3. **Order of Deletion**: To delete a category:
   - First, delete or reassign all products in all subcategories
   - Then, delete all subcategories
   - Finally, delete the category

---

# Product Subcategory API

## Overview
Product Subcategories are sub-classifications within a Product Category. Products are assigned to subcategories, not directly to categories.

**Base URL**: `/product-sub-categories`

---

## Create Product Subcategory

### Endpoint
```
POST /product-sub-categories
```

### Request Headers
```
Content-Type: application/json
```

### Request Body

#### Required Fields
- `name` (string, required): Subcategory name
- `productCategoryId` (number, required): ID of the parent category

#### Optional Fields
- `description` (string, optional): Subcategory description
- `isActive` (boolean, optional): Whether the subcategory is active (defaults to `true`)

### Example Request

```json
{
  "name": "Office Chairs",
  "description": "Ergonomic office chairs",
  "productCategoryId": 1,
  "isActive": true
}
```

### Response

#### Success Response (201 Created)
```json
{
  "id": 1,
  "name": "Office Chairs",
  "description": "Ergonomic office chairs",
  "productCategoryId": 1,
  "isActive": true,
  "productCategory": {
    "id": 1,
    "name": "Furniture"
  },
  "createdAt": "2026-01-08T10:00:00.000Z",
  "updatedAt": "2026-01-08T10:00:00.000Z"
}
```

#### Error Response (404 Not Found - Parent Category)
```json
{
  "statusCode": 404,
  "message": "Parent product category not found",
  "error": "Not Found"
}
```

#### Error Response (409 Conflict - Inactive Parent)
```json
{
  "statusCode": 409,
  "message": "Cannot create subcategory under inactive parent category",
  "error": "Conflict"
}
```

---

## Get All Product Subcategories

### Endpoint
```
GET /product-sub-categories
```

### Query Parameters
- `includeInactive` (string, optional): Set to `"true"` to include inactive subcategories. Default: only active subcategories are returned.

### Response

#### Success Response (200 OK)
```json
[
  {
    "id": 1,
    "name": "Office Chairs",
    "description": "Ergonomic office chairs",
    "productCategoryId": 1,
    "isActive": true,
    "productCategory": {
      "id": 1,
      "name": "Furniture"
    },
    "createdAt": "2026-01-08T10:00:00.000Z",
    "updatedAt": "2026-01-08T10:00:00.000Z"
  }
]
```

### Example Usage

**Get only active subcategories:**
```
GET /product-sub-categories
```

**Get all subcategories including inactive:**
```
GET /product-sub-categories?includeInactive=true
```

---

## Get Subcategories by Category

### Endpoint
```
GET /product-sub-categories/by-category/:categoryId
```

### Path Parameters
- `categoryId` (number, required): Parent category ID

### Description
Retrieves all active subcategories for a specific category.

### Response

#### Success Response (200 OK)
```json
[
  {
    "id": 1,
    "name": "Office Chairs",
    "description": "Ergonomic office chairs",
    "productCategoryId": 1,
    "isActive": true,
    "productCategory": {
      "id": 1,
      "name": "Furniture"
    },
    "createdAt": "2026-01-08T10:00:00.000Z",
    "updatedAt": "2026-01-08T10:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Dining Chairs",
    "description": "Chairs for dining tables",
    "productCategoryId": 1,
    "isActive": true,
    "productCategory": {
      "id": 1,
      "name": "Furniture"
    },
    "createdAt": "2026-01-08T10:00:00.000Z",
    "updatedAt": "2026-01-08T10:00:00.000Z"
  }
]
```

---

## Get Single Product Subcategory

### Endpoint
```
GET /product-sub-categories/:id
```

### Path Parameters
- `id` (number, required): Subcategory ID

### Response

#### Success Response (200 OK)
```json
{
  "id": 1,
  "name": "Office Chairs",
  "description": "Ergonomic office chairs",
  "productCategoryId": 1,
  "isActive": true,
  "productCategory": {
    "id": 1,
    "name": "Furniture"
  },
  "createdAt": "2026-01-08T10:00:00.000Z",
  "updatedAt": "2026-01-08T10:00:00.000Z"
}
```

#### Error Response (404 Not Found)
```json
{
  "statusCode": 404,
  "message": "Product subcategory not found",
  "error": "Not Found"
}
```

---

## Update Product Subcategory

### Endpoint
```
PATCH /product-sub-categories/:id
```

### Path Parameters
- `id` (number, required): Subcategory ID

### Request Body

All fields are optional. Only include fields you want to update.

- `name` (string, optional): Subcategory name
- `description` (string, optional): Subcategory description
- `productCategoryId` (number, optional): ID of the parent category (to move subcategory to different category)
- `isActive` (boolean, optional): Whether the subcategory is active

### Example Request

```json
{
  "name": "Ergonomic Office Chairs",
  "description": "Updated description"
}
```

### Response

#### Success Response (200 OK)
```json
{
  "id": 1,
  "name": "Ergonomic Office Chairs",
  "description": "Updated description",
  "productCategoryId": 1,
  "isActive": true,
  "productCategory": {
    "id": 1,
    "name": "Furniture"
  },
  "createdAt": "2026-01-08T10:00:00.000Z",
  "updatedAt": "2026-01-08T11:00:00.000Z"
}
```

#### Error Response (404 Not Found - Parent Category)
```json
{
  "statusCode": 404,
  "message": "Parent product category not found",
  "error": "Not Found"
}
```

#### Error Response (409 Conflict - Inactive Parent)
```json
{
  "statusCode": 409,
  "message": "Cannot move subcategory to inactive parent category",
  "error": "Conflict"
}
```

---

## Toggle Subcategory Status

### Endpoint
```
PATCH /product-sub-categories/:id/toggle-status
```

### Path Parameters
- `id` (number, required): Subcategory ID

### Description
Toggles the `isActive` status of a subcategory (active ↔ inactive).

### Response

#### Success Response (200 OK)
```json
{
  "id": 1,
  "name": "Office Chairs",
  "description": "Ergonomic office chairs",
  "productCategoryId": 1,
  "isActive": false,
  "productCategory": {
    "id": 1,
    "name": "Furniture"
  },
  "createdAt": "2026-01-08T10:00:00.000Z",
  "updatedAt": "2026-01-08T12:00:00.000Z"
}
```

---

## Delete Product Subcategory

### Endpoint
```
DELETE /product-sub-categories/:id
```

### Path Parameters
- `id` (number, required): Subcategory ID

### Description
Deletes a product subcategory. **Important**: The subcategory cannot be deleted if it has products associated with it.

### Response

#### Success Response (200 OK)
No response body. The subcategory is deleted successfully.

#### Error Response (409 Conflict - Has Products)
```json
{
  "statusCode": 409,
  "message": "Cannot delete subcategory that has products. Please delete or reassign products first.",
  "error": "Conflict"
}
```

#### Error Response (404 Not Found)
```json
{
  "statusCode": 404,
  "message": "Product subcategory not found",
  "error": "Not Found"
}
```

### Deletion Rules

1. **Check for Products**: The subcategory must not have any products associated with it
2. **Order of Deletion**: To delete a subcategory:
   - First, delete or reassign all products in the subcategory
   - Then, delete the subcategory

---

## Summary Tables

### Product Category Endpoints

| Method | Endpoint | Description | Status Codes |
|--------|----------|-------------|--------------|
| POST | `/product-categories` | Create category | 201 Created, 409 Conflict |
| GET | `/product-categories` | Get all categories | 200 OK |
| GET | `/product-categories?includeInactive=true` | Get all including inactive | 200 OK |
| GET | `/product-categories/:id` | Get single category | 200 OK, 404 Not Found |
| PATCH | `/product-categories/:id` | Update category | 200 OK, 404 Not Found, 409 Conflict |
| PATCH | `/product-categories/:id/toggle-status` | Toggle active status | 200 OK, 404 Not Found |
| DELETE | `/product-categories/:id` | Delete category | 200 OK, 404 Not Found, 409 Conflict |

### Product Subcategory Endpoints

| Method | Endpoint | Description | Status Codes |
|--------|----------|-------------|--------------|
| POST | `/product-sub-categories` | Create subcategory | 201 Created, 404 Not Found, 409 Conflict |
| GET | `/product-sub-categories` | Get all subcategories | 200 OK |
| GET | `/product-sub-categories?includeInactive=true` | Get all including inactive | 200 OK |
| GET | `/product-sub-categories/by-category/:categoryId` | Get by category | 200 OK |
| GET | `/product-sub-categories/:id` | Get single subcategory | 200 OK, 404 Not Found |
| PATCH | `/product-sub-categories/:id` | Update subcategory | 200 OK, 404 Not Found, 409 Conflict |
| PATCH | `/product-sub-categories/:id/toggle-status` | Toggle active status | 200 OK, 404 Not Found |
| DELETE | `/product-sub-categories/:id` | Delete subcategory | 200 OK, 404 Not Found, 409 Conflict |

---

## Important Notes

### Deletion Protection

1. **Category Deletion**:
   - Cannot delete if it has subcategories
   - Cannot delete if any subcategory has products
   - Must delete products first, then subcategories, then category

2. **Subcategory Deletion**:
   - Cannot delete if it has products
   - Must delete or reassign products first

### Active Status Rules

1. **Creating Subcategory**: Cannot create subcategory under inactive parent category
2. **Moving Subcategory**: Cannot move subcategory to inactive parent category
3. **Filtering**: By default, only active categories/subcategories are returned unless `includeInactive=true` is specified

### Relationship Hierarchy

```
ProductCategory (1)
  └── ProductSubCategory (many)
        └── Product (many)
```

This means:
- One category can have many subcategories
- One subcategory belongs to one category
- One subcategory can have many products
- One product belongs to one subcategory

