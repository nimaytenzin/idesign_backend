# Pagination Module

A global pagination service and DTOs to ensure consistent pagination structure across all modules.

## Features

- **Standardized Response Structure**: All paginated endpoints return the same structure
- **Type-Safe**: Generic DTOs support any data type
- **Easy to Use**: Simple service methods for common pagination operations
- **Global Module**: Available to all modules without explicit imports

## Usage

### 1. Create a Query DTO

Extend `PaginationQueryDto` for your specific needs:

```typescript
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/dto/pagination-query.dto';

export class MyEntityQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
  
  // Add other filters as needed
}
```

### 2. Use in Service

Inject `PaginationService` and use it in your service methods:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PaginationService } from '../../common/pagination/pagination.service';
import { MyEntityQueryDto } from './dto/my-entity-query.dto';
import { MyEntity } from './entities/my-entity.entity';

@Injectable()
export class MyEntityService {
  constructor(
    @InjectModel(MyEntity)
    private readonly myEntityModel: typeof MyEntity,
    private readonly paginationService: PaginationService,
  ) {}

  async findAll(queryDto: MyEntityQueryDto) {
    const { search } = queryDto;
    const { page, limit, offset } = this.paginationService.normalizePagination(queryDto);

    const where: any = {};
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await this.myEntityModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return this.paginationService.createPaginatedResponse(
      rows.map((item) => item.toJSON()),
      count,
      { page, limit },
    );
  }
}
```

### 3. Controller

The controller doesn't need any changes - just use the query DTO:

```typescript
@Get()
async findAll(@Query() queryDto: MyEntityQueryDto) {
  return this.myEntityService.findAll(queryDto);
}
```

## Response Structure

All paginated responses follow this structure:

```typescript
{
  data: T[],  // Array of items for the current page
  meta: {
    total: number,           // Total number of items across all pages
    page: number,            // Current page number
    limit: number,           // Items per page
    totalPages: number,      // Total number of pages
    hasNextPage: boolean,    // Whether there's a next page
    hasPreviousPage: boolean // Whether there's a previous page
  }
}
```

## Example Response

```json
{
  "data": [
    { "id": 1, "name": "Item 1" },
    { "id": 2, "name": "Item 2" }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## Methods

### `createPaginatedResponse<T>(data, total, queryDto)`
Creates a standardized paginated response.

### `normalizePagination(queryDto)`
Normalizes pagination parameters and returns `{ page, limit, offset }`.

### `calculateOffset(page, limit)`
Calculates the database offset for a given page and limit.
