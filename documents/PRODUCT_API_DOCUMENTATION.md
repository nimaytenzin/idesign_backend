# Product API Documentation

## Table of Contents
1. [Product CRUD Operations](#product-crud-operations)
2. [Product Media Management](#product-media-management)
3. [Product Query & Filtering](#product-query--filtering)

---

# Product CRUD Operations

## Overview
Products are the main items in the catalog. Each product belongs to a subcategory and can have multiple images.

**Base URL**: `/products`

---

## Create Product

### Endpoint
```
POST /products
```

### Request Headers
```
Content-Type: application/json
```

### Request Body

#### Required Fields
- `title` (string, required): Product title/name
- `shortDescription` (string, required): Brief product description
- `detailedDescription` (string, required): Detailed product description
- `dimensions` (string, required): Product dimensions (e.g., "10x20x30 cm")
- `weight` (number, required): Product weight (must be >= 0)
- `price` (number, required): Product price (must be >= 0)
- `material` (string, required): Product material
- `productSubCategoryId` (number, required): ID of the product subcategory

#### Optional Fields
- `isAvailable` (boolean, optional): Whether the product is available (defaults to `true`)
- `isFeatured` (boolean, optional): Whether the product is featured (defaults to `false`)
- `stockQuantity` (number, optional): Stock quantity (must be >= 0, defaults to 0)

### Example Request

```json
{
  "title": "Ergonomic Office Chair",
  "shortDescription": "Comfortable office chair with lumbar support",
  "detailedDescription": "This ergonomic office chair features adjustable height, lumbar support, and 360-degree swivel. Perfect for long work sessions.",
  "dimensions": "60x60x120 cm",
  "weight": 15.5,
  "price": 299.99,
  "material": "Mesh and Plastic",
  "productSubCategoryId": 1,
  "isAvailable": true,
  "isFeatured": false,
  "stockQuantity": 50
}
```

### Response

#### Success Response (201 Created)
```json
{
  "id": 1,
  "title": "Ergonomic Office Chair",
  "shortDescription": "Comfortable office chair with lumbar support",
  "detailedDescription": "This ergonomic office chair features adjustable height, lumbar support, and 360-degree swivel. Perfect for long work sessions.",
  "dimensions": "60x60x120 cm",
  "weight": 15.5,
  "price": 299.99,
  "material": "Mesh and Plastic",
  "isAvailable": true,
  "isFeatured": false,
  "productSubCategoryId": 1,
  "rating": 0,
  "salesCount": 0,
  "stockQuantity": 50,
  "createdAt": "2026-01-08T10:00:00.000Z",
  "updatedAt": "2026-01-08T10:00:00.000Z"
}
```

#### Error Response (404 Not Found - Subcategory)
```json
{
  "statusCode": 404,
  "message": "Product subcategory not found",
  "error": "Not Found"
}
```

---

## Get All Products (Public)

### Endpoint
```
GET /products
```

### Query Parameters
See [Product Query & Filtering](#product-query--filtering) section for all available query parameters.

### Response

#### Success Response (200 OK)
```json
[
  {
    "id": 1,
    "title": "Ergonomic Office Chair",
    "shortDescription": "Comfortable office chair with lumbar support",
    "detailedDescription": "This ergonomic office chair features...",
    "dimensions": "60x60x120 cm",
    "weight": 15.5,
    "price": 299.99,
    "material": "Mesh and Plastic",
    "isAvailable": true,
    "isFeatured": false,
    "productSubCategoryId": 1,
    "rating": 4.5,
    "salesCount": 120,
    "stockQuantity": 50,
    "productSubCategory": {
      "id": 1,
      "name": "Office Chairs",
      "description": "Ergonomic office chairs",
      "productCategory": {
        "id": 1,
        "name": "Furniture",
        "description": "All types of furniture"
      }
    },
    "images": [
      {
        "id": 1,
        "productId": 1,
        "imagePath": "/uploads/images/product-1234567890-987654321.png",
        "fileName": "product-1234567890-987654321.png",
        "orientation": "square",
        "isPrimary": true,
        "altText": "Ergonomic Office Chair"
      }
    ],
    "discountProducts": [],
    "createdAt": "2026-01-08T10:00:00.000Z",
    "updatedAt": "2026-01-08T10:00:00.000Z"
  }
]
```

---

## Get All Products (Admin)

### Endpoint
```
GET /products/admin
```

### Description
Returns all products including inactive ones. No query parameters supported.

### Response

#### Success Response (200 OK)
Same format as public endpoint, but includes inactive products.

---

## Get Featured Products

### Endpoint
```
GET /products/featured
```

### Description
Returns all featured and available products.

### Response

#### Success Response (200 OK)
Same format as public endpoint, filtered to only featured products.

---

## Get Single Product

### Endpoint
```
GET /products/:id
```

### Path Parameters
- `id` (number, required): Product ID

### Response

#### Success Response (200 OK)
```json
{
  "id": 1,
  "title": "Ergonomic Office Chair",
  "shortDescription": "Comfortable office chair with lumbar support",
  "detailedDescription": "This ergonomic office chair features adjustable height, lumbar support, and 360-degree swivel. Perfect for long work sessions.",
  "dimensions": "60x60x120 cm",
  "weight": 15.5,
  "price": 299.99,
  "material": "Mesh and Plastic",
  "isAvailable": true,
  "isFeatured": false,
  "productSubCategoryId": 1,
  "rating": 4.5,
  "salesCount": 120,
  "stockQuantity": 50,
  "productSubCategory": {
    "id": 1,
    "name": "Office Chairs",
    "description": "Ergonomic office chairs",
    "productCategory": {
      "id": 1,
      "name": "Furniture",
      "description": "All types of furniture"
    }
  },
  "images": [
    {
      "id": 1,
      "productId": 1,
      "imagePath": "/uploads/images/product-1234567890-987654321.png",
      "fileName": "product-1234567890-987654321.png",
      "orientation": "square",
      "isPrimary": true,
      "altText": "Ergonomic Office Chair"
    }
  ],
  "discountProducts": [],
  "createdAt": "2026-01-08T10:00:00.000Z",
  "updatedAt": "2026-01-08T10:00:00.000Z"
}
```

#### Error Response (404 Not Found)
```json
{
  "statusCode": 404,
  "message": "Product not found",
  "error": "Not Found"
}
```

---

## Update Product

### Endpoint
```
PATCH /products/:id
```

### Path Parameters
- `id` (number, required): Product ID

### Request Body

All fields are optional. Only include fields you want to update.

- `title` (string, optional): Product title/name
- `shortDescription` (string, optional): Brief product description
- `detailedDescription` (string, optional): Detailed product description
- `dimensions` (string, optional): Product dimensions
- `weight` (number, optional): Product weight (must be >= 0)
- `price` (number, optional): Product price (must be >= 0)
- `material` (string, optional): Product material
- `productSubCategoryId` (number, optional): ID of the product subcategory
- `isAvailable` (boolean, optional): Whether the product is available
- `isFeatured` (boolean, optional): Whether the product is featured
- `stockQuantity` (number, optional): Stock quantity (must be >= 0)

### Example Request

```json
{
  "title": "Premium Ergonomic Office Chair",
  "price": 349.99,
  "isFeatured": true
}
```

### Response

#### Success Response (200 OK)
Returns the updated product with all relations.

#### Error Response (404 Not Found)
```json
{
  "statusCode": 404,
  "message": "Product subcategory not found",
  "error": "Not Found"
}
```

---

## Delete Product

### Endpoint
```
DELETE /products/:id
```

### Path Parameters
- `id` (number, required): Product ID

### Description
Deletes a product. **Note**: This will also delete all associated product images.

### Response

#### Success Response (200 OK)
No response body. The product is deleted successfully.

#### Error Response (404 Not Found)
```json
{
  "statusCode": 404,
  "message": "Product not found",
  "error": "Not Found"
}
```

---

## Increment Sales Count

### Endpoint
```
PATCH /products/:id/sales
```

### Path Parameters
- `id` (number, required): Product ID

### Description
Increments the sales count by 1. Useful for tracking product popularity.

### Response

#### Success Response (200 OK)
Returns the updated product with incremented `salesCount`.

---

## Update Product Rating

### Endpoint
```
PATCH /products/:id/rating
```

### Path Parameters
- `id` (number, required): Product ID

### Request Body

```json
{
  "rating": 4.5
}
```

### Description
Updates the product rating. Typically used to calculate average rating from reviews.

### Response

#### Success Response (200 OK)
Returns the updated product with new `rating`.

---

# Product Media Management

## Overview
Product images are managed separately from product CRUD operations. Each product can have multiple images, with one designated as the primary image.

**Base URL**: `/products/:id/images` or `/products/:productId/images/:imageId`

---

## Upload Product Images

### Endpoint
```
POST /products/:id/images
```

### Path Parameters
- `id` (number, required): Product ID

### Request Headers
```
Content-Type: multipart/form-data
```

### Request Body (Form Data)

#### Required Fields
- `images` (file[], required): One or more image files (max 10 files per request)
  - **File types**: jpg, jpeg, png, gif
  - **Max file size**: 5MB per file
  - **Max files**: 10

#### Optional Fields
- `orientations` (string[], optional): Array of orientations for each image. Values: `"portrait"`, `"landscape"`, `"square"` (default: `"square"`)
- `altTexts` (string[], optional): Array of alt text for each image
- `isPrimary` (boolean[], optional): Array indicating which images should be primary (first image is primary by default)

### Example Request (cURL)

```bash
curl -X POST http://localhost:3000/products/1/images \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.png" \
  -F "orientations=[\"square\",\"portrait\"]" \
  -F "altTexts=[\"Front view\",\"Side view\"]" \
  -F "isPrimary=[true,false]"
```

### Example Request (JavaScript/Fetch)

```javascript
const formData = new FormData();
formData.append('images', fileInput1.files[0]);
formData.append('images', fileInput2.files[0]);
formData.append('orientations', JSON.stringify(['square', 'portrait']));
formData.append('altTexts', JSON.stringify(['Front view', 'Side view']));
formData.append('isPrimary', JSON.stringify([true, false]));

fetch('http://localhost:3000/products/1/images', {
  method: 'POST',
  body: formData
})
  .then(res => res.json())
  .then(data => console.log('Images uploaded:', data));
```

### Response

#### Success Response (201 Created)
```json
[
  {
    "id": 1,
    "productId": 1,
    "imagePath": "/uploads/images/product-1234567890-987654321.jpg",
    "fileName": "product-1234567890-987654321.jpg",
    "orientation": "square",
    "isPrimary": true,
    "altText": "Front view",
    "createdAt": "2026-01-08T10:00:00.000Z",
    "updatedAt": "2026-01-08T10:00:00.000Z"
  },
  {
    "id": 2,
    "productId": 1,
    "imagePath": "/uploads/images/product-1234567891-987654322.png",
    "fileName": "product-1234567891-987654322.png",
    "orientation": "portrait",
    "isPrimary": false,
    "altText": "Side view",
    "createdAt": "2026-01-08T10:00:01.000Z",
    "updatedAt": "2026-01-08T10:00:01.000Z"
  }
]
```

#### Error Response (404 Not Found)
```json
{
  "statusCode": 404,
  "message": "Product not found",
  "error": "Not Found"
}
```

#### Error Response (400 Bad Request - Invalid File Type)
```json
{
  "statusCode": 400,
  "message": "Only image files are allowed!",
  "error": "Bad Request"
}
```

### Notes

1. **File Naming**: Files are automatically renamed with format: `product-{timestamp}-{random}.{ext}`
2. **Primary Image**: If `isPrimary` is set to `true` for any image, all other images for that product will have `isPrimary` set to `false`
3. **Default Primary**: If no `isPrimary` is specified, the first image becomes primary
4. **File Storage**: Images are stored in `./uploads/images/` directory

---

## Get Product Images

### Endpoint
```
GET /products/:id/images
```

### Path Parameters
- `id` (number, required): Product ID

### Description
Retrieves all images for a specific product, ordered by creation date (oldest first).

### Response

#### Success Response (200 OK)
```json
[
  {
    "id": 1,
    "productId": 1,
    "imagePath": "/uploads/images/product-1234567890-987654321.jpg",
    "fileName": "product-1234567890-987654321.jpg",
    "orientation": "square",
    "isPrimary": true,
    "altText": "Front view",
    "createdAt": "2026-01-08T10:00:00.000Z",
    "updatedAt": "2026-01-08T10:00:00.000Z"
  },
  {
    "id": 2,
    "productId": 1,
    "imagePath": "/uploads/images/product-1234567891-987654322.png",
    "fileName": "product-1234567891-987654322.png",
    "orientation": "portrait",
    "isPrimary": false,
    "altText": "Side view",
    "createdAt": "2026-01-08T10:00:01.000Z",
    "updatedAt": "2026-01-08T10:00:01.000Z"
  }
]
```

---

## Update Product Image

### Endpoint
```
PATCH /products/:productId/images/:imageId
```

### Path Parameters
- `productId` (number, required): Product ID
- `imageId` (number, required): Image ID

### Request Body

All fields are optional. Only include fields you want to update.

- `orientation` (enum, optional): Image orientation. Values: `"portrait"`, `"landscape"`, `"square"`
- `isPrimary` (boolean, optional): Whether this image is the primary image
- `altText` (string, optional): Alt text for the image

### Example Request

```json
{
  "orientation": "landscape",
  "isPrimary": true,
  "altText": "Updated alt text"
}
```

### Response

#### Success Response (200 OK)
```json
{
  "id": 1,
  "productId": 1,
  "imagePath": "/uploads/images/product-1234567890-987654321.jpg",
  "fileName": "product-1234567890-987654321.jpg",
  "orientation": "landscape",
  "isPrimary": true,
  "altText": "Updated alt text",
  "createdAt": "2026-01-08T10:00:00.000Z",
  "updatedAt": "2026-01-08T10:05:00.000Z"
}
```

#### Error Response (404 Not Found)
```json
{
  "statusCode": 404,
  "message": "Product image not found",
  "error": "Not Found"
}
```

### Notes

- **Primary Image**: If `isPrimary` is set to `true`, all other images for that product will automatically have `isPrimary` set to `false`

---

## Delete Product Image

### Endpoint
```
DELETE /products/:productId/images/:imageId
```

### Path Parameters
- `productId` (number, required): Product ID
- `imageId` (number, required): Image ID

### Description
Deletes a product image. **Note**: This only removes the database record. The actual file remains on the server.

### Response

#### Success Response (200 OK)
No response body. The image is deleted successfully.

#### Error Response (404 Not Found)
```json
{
  "statusCode": 404,
  "message": "Product image not found",
  "error": "Not Found"
}
```

---

## Set Primary Image

### Endpoint
```
PATCH /products/:productId/images/:imageId/primary
```

### Path Parameters
- `productId` (number, required): Product ID
- `imageId` (number, required): Image ID to set as primary

### Description
Sets a specific image as the primary image for the product. All other images for that product will have `isPrimary` set to `false`.

### Response

#### Success Response (200 OK)
```json
{
  "id": 2,
  "productId": 1,
  "imagePath": "/uploads/images/product-1234567891-987654322.png",
  "fileName": "product-1234567891-987654322.png",
  "orientation": "portrait",
  "isPrimary": true,
  "altText": "Side view",
  "createdAt": "2026-01-08T10:00:01.000Z",
  "updatedAt": "2026-01-08T10:10:00.000Z"
}
```

#### Error Response (404 Not Found)
```json
{
  "statusCode": 404,
  "message": "Product image not found",
  "error": "Not Found"
}
```

---

# Product Query & Filtering

## Overview
The `GET /products` endpoint supports various query parameters for filtering and sorting products.

### Query Parameters

#### Category Filtering
- `category` (string, optional): Filter by category name (case-insensitive partial match)
- `categoryId` (number, optional): Filter by category ID
- `subCategoryId` (number, optional): Filter by subcategory ID

#### Search
- `search` (string, optional): Search in title, shortDescription, and detailedDescription (case-insensitive partial match)

#### Filtering
- `material` (string, optional): Filter by material (case-insensitive partial match)
- `isAvailable` (boolean, optional): Filter by availability status
- `availability` (boolean, optional): Alias for `isAvailable` (legacy support)
- `isFeatured` (boolean, optional): Filter by featured status

#### Sorting
- `sortBy` (enum, optional): Sort products by:
  - `price_asc`: Price (low to high)
  - `price_desc`: Price (high to low)
  - `newest`: Newest first (default)
  - `rating`: Highest rating first
  - `best_selling`: Best selling first (by salesCount)
  - `size`: By dimensions (ascending)

### Example Requests

**Get products by category:**
```
GET /products?categoryId=1
```

**Get products by subcategory:**
```
GET /products?subCategoryId=5
```

**Search products:**
```
GET /products?search=chair
```

**Filter by material:**
```
GET /products?material=wood
```

**Get only available products:**
```
GET /products?isAvailable=true
```

**Get featured products:**
```
GET /products?isFeatured=true
```

**Sort by price (low to high):**
```
GET /products?sortBy=price_asc
```

**Combined filters:**
```
GET /products?categoryId=1&isAvailable=true&sortBy=price_asc&search=chair
```

---

## Summary Tables

### Product CRUD Endpoints

| Method | Endpoint | Description | Status Codes |
|--------|----------|-------------|--------------|
| POST | `/products` | Create product | 201 Created, 404 Not Found |
| GET | `/products` | Get all products (with filters) | 200 OK |
| GET | `/products/admin` | Get all products (admin) | 200 OK |
| GET | `/products/featured` | Get featured products | 200 OK |
| GET | `/products/:id` | Get single product | 200 OK, 404 Not Found |
| PATCH | `/products/:id` | Update product | 200 OK, 404 Not Found |
| DELETE | `/products/:id` | Delete product | 200 OK, 404 Not Found |
| PATCH | `/products/:id/sales` | Increment sales count | 200 OK, 404 Not Found |
| PATCH | `/products/:id/rating` | Update rating | 200 OK, 404 Not Found |

### Product Media Endpoints

| Method | Endpoint | Description | Status Codes |
|--------|----------|-------------|--------------|
| POST | `/products/:id/images` | Upload images | 201 Created, 404 Not Found, 400 Bad Request |
| GET | `/products/:id/images` | Get product images | 200 OK |
| PATCH | `/products/:productId/images/:imageId` | Update image | 200 OK, 404 Not Found |
| DELETE | `/products/:productId/images/:imageId` | Delete image | 200 OK, 404 Not Found |
| PATCH | `/products/:productId/images/:imageId/primary` | Set primary image | 200 OK, 404 Not Found |

---

## Important Notes

### Product Management

1. **Subcategory Required**: Products must belong to a subcategory (not directly to a category)
2. **Image Management**: Product images are managed separately from product CRUD operations
3. **Primary Image**: Each product can have one primary image, which is automatically managed
4. **Sales Tracking**: Use the `/sales` endpoint to increment sales count when a product is sold
5. **Rating**: Rating should be updated based on customer reviews

### Image Management

1. **File Upload**: Images are uploaded via multipart/form-data
2. **File Storage**: Images are stored in `./uploads/images/` directory
3. **File Naming**: Files are automatically renamed with unique names
4. **Primary Image**: Setting a new primary image automatically removes primary status from others
5. **File Deletion**: Deleting an image record does NOT delete the physical file (manual cleanup may be needed)

### Query & Filtering

1. **Default Sort**: Products are sorted by creation date (newest first) by default
2. **Case Insensitive**: Search and filter operations are case-insensitive
3. **Partial Match**: Search and material filters use partial matching
4. **Combined Filters**: Multiple filters can be combined in a single request

