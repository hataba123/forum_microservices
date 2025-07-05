// Interface cho API response chuẩn
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  meta?: {
    timestamp: string;
    version: string;
    [key: string]: any;
  };
}

// Interface cho error response
export interface ErrorResponse {
  success: false;
  message: string;
  errors: string[];
  statusCode: number;
}
