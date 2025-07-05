// Interface cho pagination response
export interface PaginationInterface {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Interface cho paginated data
export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationInterface;
}
