# Angular Frontend Integration Guide

This README provides instructions for generating DTOs and data service files for your Angular frontend to integrate with the NestJS Product Catalog Backend.

## 📋 Backend API Overview

Your NestJS backend provides the following modules:
- **ProductCategory Module**: Manages main product categories
- **ProductSubCategory Module**: Manages subcategories that belong to categories
- **Product Module**: Manages products with multiple image support

## 🔧 Generate TypeScript DTOs

### 1. ProductCategory and ProductSubCategory DTOs

Create `src/app/models/category.model.ts`:

```typescript
export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  subCategories?: ProductSubCategory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductSubCategory {
  id: number;
  name: string;
  description?: string;
  productCategoryId: number;
  isActive: boolean;
  productCategory?: ProductCategory;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductCategoryDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateProductCategoryDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateProductSubCategoryDto {
  name: string;
  description?: string;
  productCategoryId: number;
  isActive?: boolean;
}

export interface UpdateProductSubCategoryDto {
  name?: string;
  description?: string;
  productCategoryId?: number;
  isActive?: boolean;
}
```

### 2. Product DTOs

Create `src/app/models/product.model.ts`:

```typescript
import { ProductSubCategory } from './category.model';

export interface ProductImage {
  id: number;
  productId: number;
  imagePath: string;
  fileName: string;
  orientation: 'portrait' | 'landscape' | 'square';
  isPrimary: boolean;
  altText?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: number;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  dimensions: string;
  weight: number;
  price: number;
  material: string;
  stockQuantity: number;
  isAvailable: boolean;
  productSubCategoryId: number;
  rating: number;
  salesCount: number;
  productSubCategory?: ProductSubCategory;
  images: ProductImage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductDto {
  title: string;
  shortDescription: string;
  detailedDescription: string;
  dimensions: string;
  weight: number;
  price: number;
  material: string;
  stockQuantity: number;
  isAvailable?: boolean;
  productSubCategoryId: number;
}

export interface UpdateProductDto {
  title?: string;
  shortDescription?: string;
  detailedDescription?: string;
  dimensions?: string;
  weight?: number;
  price?: number;
  material?: string;
  stockQuantity?: number;
  isAvailable?: boolean;
  productSubCategoryId?: number;
}

export interface ProductQueryDto {
  category?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'best_selling' | 'size';
  material?: string;
  availability?: boolean;
  search?: string;
}

export interface CreateProductImageDto {
  productId: number;
  imagePath: string;
  fileName: string;
  orientation?: 'portrait' | 'landscape' | 'square';
  isPrimary?: boolean;
  altText?: string;
}

export interface UpdateProductImageDto {
  imagePath?: string;
  fileName?: string;
  orientation?: 'portrait' | 'landscape' | 'square';
  isPrimary?: boolean;
  altText?: string;
}
```

## 🌐 Generate Data Services

### 1. ProductCategory Service

Create `src/app/services/product-category.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductCategory, CreateProductCategoryDto, UpdateProductCategoryDto } from '../models/category.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductCategoryService {
  private readonly apiUrl = `${environment.apiBaseUrl}/product-categories`;

  constructor(private http: HttpClient) {}

  // Get all product categories
  getCategories(): Observable<ProductCategory[]> {
    return this.http.get<ProductCategory[]>(this.apiUrl);
  }

  // Get category by ID
  getCategoryById(id: number): Observable<ProductCategory> {
    return this.http.get<ProductCategory>(`${this.apiUrl}/${id}`);
  }

  // Create new category
  createCategory(categoryData: CreateProductCategoryDto): Observable<ProductCategory> {
    return this.http.post<ProductCategory>(this.apiUrl, categoryData);
  }

  // Update category
  updateCategory(id: number, categoryData: UpdateProductCategoryDto): Observable<ProductCategory> {
    return this.http.patch<ProductCategory>(`${this.apiUrl}/${id}`, categoryData);
  }

  // Delete category
  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

### 2. ProductSubCategory Service

Create `src/app/services/product-sub-category.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductSubCategory, CreateProductSubCategoryDto, UpdateProductSubCategoryDto } from '../models/category.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductSubCategoryService {
  private readonly apiUrl = `${environment.apiBaseUrl}/product-sub-categories`;

  constructor(private http: HttpClient) {}

  // Get all product subcategories
  getSubCategories(): Observable<ProductSubCategory[]> {
    return this.http.get<ProductSubCategory[]>(this.apiUrl);
  }

  // Get subcategories by category ID
  getSubCategoriesByCategoryId(categoryId: number): Observable<ProductSubCategory[]> {
    return this.http.get<ProductSubCategory[]>(`${this.apiUrl}/category/${categoryId}`);
  }

  // Get subcategory by ID
  getSubCategoryById(id: number): Observable<ProductSubCategory> {
    return this.http.get<ProductSubCategory>(`${this.apiUrl}/${id}`);
  }

  // Create new subcategory
  createSubCategory(subCategoryData: CreateProductSubCategoryDto): Observable<ProductSubCategory> {
    return this.http.post<ProductSubCategory>(this.apiUrl, subCategoryData);
  }

  // Update subcategory
  updateSubCategory(id: number, subCategoryData: UpdateProductSubCategoryDto): Observable<ProductSubCategory> {
    return this.http.patch<ProductSubCategory>(`${this.apiUrl}/${id}`, subCategoryData);
  }

  // Delete subcategory
  deleteSubCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

### 3. Product Service

Create `src/app/services/product.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Product, 
  CreateProductDto, 
  UpdateProductDto, 
  ProductQueryDto,
  ProductImage,
  CreateProductImageDto,
  UpdateProductImageDto 
} from '../models/product.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = `${environment.apiBaseUrl}/products`;

  constructor(private http: HttpClient) {}

  // Create new product
  createProduct(productData: CreateProductDto): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, productData);
  }

  // Get all products (admin view)
  getAllProductsAdmin(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/admin`);
  }

  // Get products with query/filtering (customer view)
  getProducts(query?: ProductQueryDto): Observable<Product[]> {
    let params = new HttpParams();
    
    if (query) {
      if (query.category) params = params.set('category', query.category);
      if (query.sortBy) params = params.set('sortBy', query.sortBy);
      if (query.material) params = params.set('material', query.material);
      if (query.availability !== undefined) params = params.set('availability', query.availability.toString());
      if (query.search) params = params.set('search', query.search);
    }

    return this.http.get<Product[]>(this.apiUrl, { params });
  }

  // Get product by ID
  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  // Update product
  updateProduct(id: number, productData: UpdateProductDto): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}`, productData);
  }

  // Delete product
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Increment sales count
  incrementSales(id: number): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}/sales`, {});
  }

  // Update product rating
  updateRating(id: number, rating: number): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}/rating`, { rating });
  }

  // === Product Images ===

  // Upload multiple images to product
  uploadProductImages(
    productId: number, 
    files: File[], 
    metadata?: {
      orientations?: string[];
      altTexts?: string[];
      isPrimary?: boolean[];
    }
  ): Observable<ProductImage[]> {
    const formData = new FormData();
    
    // Add files
    files.forEach(file => {
      formData.append('images', file);
    });

    // Add metadata if provided
    if (metadata) {
      if (metadata.orientations) {
        formData.append('orientations', JSON.stringify(metadata.orientations));
      }
      if (metadata.altTexts) {
        formData.append('altTexts', JSON.stringify(metadata.altTexts));
      }
      if (metadata.isPrimary) {
        formData.append('isPrimary', JSON.stringify(metadata.isPrimary));
      }
    }

    return this.http.post<ProductImage[]>(`${this.apiUrl}/${productId}/images`, formData);
  }

  // Get all images for a product
  getProductImages(productId: number): Observable<ProductImage[]> {
    return this.http.get<ProductImage[]>(`${this.apiUrl}/${productId}/images`);
  }

  // Update image metadata
  updateProductImage(
    productId: number, 
    imageId: number, 
    imageData: UpdateProductImageDto
  ): Observable<ProductImage> {
    return this.http.patch<ProductImage>(`${this.apiUrl}/${productId}/images/${imageId}`, imageData);
  }

  // Delete product image
  deleteProductImage(productId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${productId}/images/${imageId}`);
  }

  // Set primary image
  setPrimaryImage(productId: number, imageId: number): Observable<ProductImage> {
    return this.http.patch<ProductImage>(`${this.apiUrl}/${productId}/images/${imageId}/primary`, {});
  }
}
```

## ⚙️ Environment Configuration

Update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000' // Your NestJS backend URL
};
```

Update `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://your-production-api.com' // Your production backend URL
};
```

## 🔧 Setup HttpClient

In your `app.module.ts`, make sure to import HttpClientModule:

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule // Add this
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## 📱 Example Usage in Components

### Category Component Example

```typescript
import { Component, OnInit } from '@angular/core';
import { ProductCategoryService } from '../services/product-category.service';
import { ProductSubCategoryService } from '../services/product-sub-category.service';
import { ProductCategory, ProductSubCategory } from '../models/category.model';

@Component({
  selector: 'app-categories',
  template: `
    <div *ngFor="let category of categories">
      <h3>{{ category.name }}</h3>
      <p>{{ category.description }}</p>
      <ul *ngIf="category.subCategories?.length">
        <li *ngFor="let sub of category.subCategories">
          {{ sub.name }} - {{ sub.description }}
        </li>
      </ul>
    </div>
  `
})
export class CategoriesComponent implements OnInit {
  categories: ProductCategory[] = [];

  constructor(
    private categoryService: ProductCategoryService,
    private subCategoryService: ProductSubCategoryService
  ) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        // Load subcategories for each category
        categories.forEach(category => {
          this.loadSubCategories(category.id, category);
        });
      },
      error: (error) => console.error('Error loading categories:', error)
    });
  }

  loadSubCategories(categoryId: number, category: ProductCategory) {
    this.subCategoryService.getSubCategoriesByCategoryId(categoryId).subscribe({
      next: (subCategories) => category.subCategories = subCategories,
      error: (error) => console.error('Error loading subcategories:', error)
    });
  }
}
```

### Product Component Example

```typescript
import { Component, OnInit } from '@angular/core';
import { ProductService } from '../services/product.service';
import { Product, ProductQueryDto } from '../models/product.model';

@Component({
  selector: 'app-products',
  template: `
    <div class="product-grid">
      <div *ngFor="let product of products" class="product-card">
        <img [src]="getPrimaryImage(product)" [alt]="product.title">
        <h3>{{ product.title }}</h3>
        <p>{{ product.shortDescription }}</p>
        <p class="price">\${{ product.price }}</p>
      </div>
    </div>
  `
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts(query?: ProductQueryDto) {
    this.productService.getProducts(query).subscribe({
      next: (products) => this.products = products,
      error: (error) => console.error('Error loading products:', error)
    });
  }

  getPrimaryImage(product: Product): string {
    const primaryImage = product.images?.find(img => img.isPrimary);
    return primaryImage ? primaryImage.imagePath : '/assets/no-image.png';
  }

  searchProducts(searchTerm: string) {
    this.loadProducts({ search: searchTerm });
  }

  filterByCategory(category: string) {
    this.loadProducts({ category });
  }

  sortProducts(sortBy: string) {
    this.loadProducts({ sortBy: sortBy as any });
  }
}
```

## 🚀 Quick Start Commands

```bash
# Generate the models directory
mkdir -p src/app/models

# Generate the services directory
mkdir -p src/app/services

# Create the files
touch src/app/models/category.model.ts
touch src/app/models/product.model.ts
touch src/app/services/product-category.service.ts
touch src/app/services/product-sub-category.service.ts
touch src/app/services/product.service.ts
```

## 📝 Notes

- All timestamps are automatically handled by the backend
- File uploads use FormData for multipart/form-data requests
- Images are stored with relative paths from the backend
- Primary image logic ensures only one image per product is marked as primary
- ProductCategory and ProductSubCategory have a hierarchical relationship
- Products belong to ProductSubCategory, which belongs to ProductCategory
- Error handling should be implemented in your components using RxJS operators

This setup provides a complete type-safe integration between your Angular frontend and NestJS backend with the new category structure!