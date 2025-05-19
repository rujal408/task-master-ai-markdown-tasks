// Define the Permission type
export type Permission = 
  | '*' // Wildcard for admin access
  // User permissions
  | 'USER_CREATE'
  | 'USER_READ'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'USER_MANAGE_ROLES'
  
  // Book permissions
  | 'BOOK_CREATE'
  | 'BOOK_READ'
  | 'BOOK_UPDATE'
  | 'BOOK_DELETE'
  | 'BOOK_MANAGE_CATEGORIES'
  
  // Transaction permissions
  | 'TRANSACTION_CREATE'
  | 'TRANSACTION_READ'
  | 'TRANSACTION_UPDATE'
  | 'TRANSACTION_DELETE'
  | 'TRANSACTION_OVERRIDE'
  
  // Reservation permissions
  | 'RESERVATION_CREATE'
  | 'RESERVATION_READ'
  | 'RESERVATION_UPDATE'
  | 'RESERVATION_DELETE'
  
  // Report permissions
  | 'REPORT_VIEW'
  | 'REPORT_GENERATE'
  | 'REPORT_EXPORT'
  
  // System permissions
  | 'SYSTEM_SETTINGS_UPDATE'
  | 'SYSTEM_MAINTENANCE';

// Export UserRole from Prisma for convenience
export { UserRole } from '@prisma/client';
