import { Injectable } from '@nestjs/common';
import { PaginatedResponseDto } from './dto/paginated-response.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

/**
 * Global pagination service
 * Provides standardized pagination logic for all modules
 */
@Injectable()
export class PaginationService {
  /**
   * Creates a paginated response with consistent structure
   * @param data Array of items for the current page
   * @param total Total number of items across all pages
   * @param queryDto Pagination query parameters
   * @returns PaginatedResponseDto with data and metadata
   */
  createPaginatedResponse<T>(
    data: T[],
    total: number,
    queryDto: PaginationQueryDto,
  ): PaginatedResponseDto<T> {
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;

    return new PaginatedResponseDto<T>(data, total, page, limit);
  }

  /**
   * Calculates offset for database queries
   * @param page Current page number
   * @param limit Items per page
   * @returns Offset value for database queries
   */
  calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Normalizes pagination parameters
   * Ensures page and limit are within valid ranges
   * @param queryDto Pagination query parameters
   * @returns Normalized pagination parameters
   */
  normalizePagination(queryDto: PaginationQueryDto): {
    page: number;
    limit: number;
    offset: number;
  } {
    const page = Math.max(1, queryDto.page || 1);
    const limit = Math.min(100, Math.max(1, queryDto.limit || 10));
    const offset = this.calculateOffset(page, limit);

    return { page, limit, offset };
  }
}
