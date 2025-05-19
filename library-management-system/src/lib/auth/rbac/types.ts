import { UserRole as PrismaUserRole } from '@prisma/client';

// Use Prisma's UserRole enum to ensure consistency
export type UserRole = PrismaUserRole;

export enum Permission {
  // User permissions
  USER_CREATE = 'USER_CREATE',
  USER_READ = 'USER_READ',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  USER_MANAGE_ROLES = 'USER_MANAGE_ROLES',
  USER_UPDATE_PASSWORD = 'USER_UPDATE_PASSWORD',
  
  // Book permissions
  BOOK_CREATE = 'BOOK_CREATE',
  BOOK_READ = 'BOOK_READ',
  BOOK_UPDATE = 'BOOK_UPDATE',
  BOOK_DELETE = 'BOOK_DELETE',
  BOOK_MANAGE_CATEGORIES = 'BOOK_MANAGE_CATEGORIES',

  // Transaction permissions
  TRANSACTION_CREATE = 'TRANSACTION_CREATE',
  TRANSACTION_READ = 'TRANSACTION_READ',
  TRANSACTION_UPDATE = 'TRANSACTION_UPDATE',
  TRANSACTION_DELETE = 'TRANSACTION_DELETE',
  TRANSACTION_OVERRIDE = 'TRANSACTION_OVERRIDE',

  // Reservation permissions
  RESERVATION_CREATE = 'RESERVATION_CREATE',
  RESERVATION_READ = 'RESERVATION_READ',
  RESERVATION_UPDATE = 'RESERVATION_UPDATE',
  RESERVATION_DELETE = 'RESERVATION_DELETE',

  // Report permissions
  REPORT_VIEW = 'REPORT_VIEW',
  REPORT_GENERATE = 'REPORT_GENERATE',
  REPORT_EXPORT = 'REPORT_EXPORT',

  // System permissions
  SYSTEM_SETTINGS_UPDATE = 'SYSTEM_SETTINGS_UPDATE',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE'
}

export interface RoleDefinition {
  name: UserRole;
  permissions: Permission[];
  description: string;
}

export interface UserRoles {
  roles: UserRole[];
  permissions: Permission[];
}

// Session user with roles and permissions
export interface SessionUser {
  id: string;
  name?: string | null;
  email: string;
  roles: UserRole[];
  permissions: Permission[];
  image?: string | null;
}
