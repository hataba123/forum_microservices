// Utility functions cho pagination
import { PaginationInterface, PaginatedResult } from '../interfaces/pagination.interface';

// Class helper cho pagination
export class PaginationUtil {
  // Tính toán metadata cho pagination
  static createPaginationMeta(
    page: number,
    limit: number,
    total: number,
  ): PaginationInterface {
    const totalPages = Math.ceil(total / limit);
    
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  // Tạo pagination result với data
  static createPaginatedResult<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
  ): PaginatedResult<T> {
    return {
      data,
      pagination: this.createPaginationMeta(page, limit, total),
    };
  }

  // Tính offset cho database query
  static getOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  // Validate và sanitize pagination params
  static validatePaginationParams(page?: number, limit?: number) {
    const validatedPage = Math.max(1, page || 1);
    const validatedLimit = Math.min(100, Math.max(1, limit || 20));
    
    return {
      page: validatedPage,
      limit: validatedLimit,
      offset: this.getOffset(validatedPage, validatedLimit),
    };
  }
}
