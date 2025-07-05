// Các hằng số dùng chung trong ứng dụng
export const APP_CONSTANTS = {
  // JWT
  JWT_ACCESS_EXPIRES: '15m',
  JWT_REFRESH_EXPIRES: '7d',
  
  // Cookie
  COOKIE_REFRESH_TOKEN: 'refresh-token',
  COOKIE_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // File upload
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  
  // Cache TTL
  CACHE_TTL: {
    SHORT: 300, // 5 minutes
    MEDIUM: 1800, // 30 minutes
    LONG: 3600, // 1 hour
  },
};

// Error codes
export const ERROR_CODES = {
  // Auth errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // User errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  
  // Thread errors
  THREAD_NOT_FOUND: 'THREAD_NOT_FOUND',
  THREAD_LOCKED: 'THREAD_LOCKED',
  
  // Post errors
  POST_NOT_FOUND: 'POST_NOT_FOUND',
  CANNOT_EDIT_POST: 'CANNOT_EDIT_POST',
  
  // General errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  FORBIDDEN: 'FORBIDDEN',
};
