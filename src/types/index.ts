import { Request } from 'express';

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Request with query params
export interface RequestWithPagination extends Request {
  pagination?: PaginationParams;
}

// Product filters
export interface ProductFilters {
  search?: string;
  supplyRisk?: 'HIGH' | 'MEDIUM' | 'LOW';
  supplierId?: string;
  groupId?: string;
}

// Stock filters
export interface StockFilters {
  siteId?: string;
  productId?: string;
  lowStock?: boolean;
}

// Movement filters
export interface MovementFilters {
  productId?: string;
  type?: 'IN' | 'OUT' | 'TRANSFER';
  siteId?: string;
  startDate?: Date;
  endDate?: Date;
  operator?: string;
}

// Order filters
export interface OrderFilters {
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  supplierId?: string;
  productId?: string;
  startDate?: Date;
  endDate?: Date;
}
