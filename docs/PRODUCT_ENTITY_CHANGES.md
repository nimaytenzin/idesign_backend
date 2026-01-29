# Product Entity Changes

This document describes the product entity updates: **material made optional** and **stockQuantity (stock count) removed**.

---

## 1. Entity (`product.entity.ts`)

### `material` — now optional

- **Before:** `allowNull: false`
- **After:** `allowNull: true`
- **Effect:** `material` can be `null` in the database.

### `stockQuantity` — removed

- **Before:** Column existed with `DataType.INTEGER`, `defaultValue: 0`.
- **After:** Column removed from the entity.
- **Effect:** Product no longer has a stock/inventory field at the entity level.

---

## 2. DTOs

### `CreateProductDto`

| Field           | Before                    | After                          |
|----------------|---------------------------|--------------------------------|
| `material`     | `@IsString()` `@IsNotEmpty()` — required | `@IsString()` `@IsOptional()` — optional |
| `stockQuantity`| `@IsNumber()` `@Min(0)` `@IsOptional()`  | **Removed**                    |

### `UpdateProductDto`

- Extends `PartialType(CreateProductDto)`, so it automatically:
  - allows `material` as optional,
  - no longer includes `stockQuantity`.

### `ProductResponseDto`

| Field        | Before        | After              |
|-------------|---------------|--------------------|
| `material`  | `string`      | `string \| null`   |
| `stockQuantity` | `number`  | **Removed**        |

---

## 3. Product Service (`product.service.ts`)

- **No changes.**
- `findAllWithQuery` still supports `queryDto.material`; filtering by `material` only runs when it is provided. Optional `material` on the entity does not affect this.
- `stockQuantity` was not used in the service; its removal requires no service updates.

---

## 4. Product Query DTO (`product-query.dto.ts`)

- **No changes.**
- `material` remains an optional filter (`material?: string`). It continues to work for products that have `material` set.

---

## 5. Database Migration

Apply schema changes in your database:

1. **`material`**
   - Change column to nullable, e.g.:
     ```sql
     ALTER TABLE "Products" ALTER COLUMN "material" DROP NOT NULL;
     ```
   - (Exact syntax may vary by DB and migration tool.)

2. **`stockQuantity`**
   - Drop the column, e.g.:
     ```sql
     ALTER TABLE "Products" DROP COLUMN "stockQuantity";
     ```
   - (Column name may be `stock_quantity` if using snake_case.)

If you use Sequelize migrations, generate and run a migration that performs these two changes. Ensure backups and tests before running in production.

---

## 6. Summary

| Item            | Change                                                                 |
|-----------------|------------------------------------------------------------------------|
| **Entity**      | `material` optional; `stockQuantity` removed                           |
| **CreateProductDto** | `material` optional; `stockQuantity` removed                     |
| **UpdateProductDto** | Follows CreateProductDto (no extra edits)                        |
| **ProductResponseDto** | `material` as `string \| null`; `stockQuantity` removed          |
| **ProductService**    | No changes                                                       |
| **ProductQueryDto**   | No changes                                                       |
