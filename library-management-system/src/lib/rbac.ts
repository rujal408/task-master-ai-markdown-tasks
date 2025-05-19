import type { UserRole } from '@/types/user-role';
import type { Permission } from '@/types/permissions';

// Define the role permissions mapping using string literals
type RolePermissions = {
  [key in UserRole]: Permission[];
};

export const rolePermissions: RolePermissions = {
  'SUPER_ADMIN': [
    // All permissions
    'USER_CREATE', 'USER_READ', 'USER_UPDATE', 'USER_DELETE', 'USER_MANAGE_ROLES',
    'BOOK_CREATE', 'BOOK_READ', 'BOOK_UPDATE', 'BOOK_DELETE', 'BOOK_MANAGE_CATEGORIES',
    'TRANSACTION_CREATE', 'TRANSACTION_READ', 'TRANSACTION_UPDATE', 'TRANSACTION_DELETE', 'TRANSACTION_OVERRIDE',
    'RESERVATION_CREATE', 'RESERVATION_READ', 'RESERVATION_UPDATE', 'RESERVATION_DELETE',
    'REPORT_VIEW', 'REPORT_GENERATE', 'REPORT_EXPORT',
    'SYSTEM_MAINTENANCE',
  ],
  'ADMIN': [
    // User permissions
    'USER_CREATE', 'USER_READ', 'USER_UPDATE', 'USER_DELETE', 'USER_MANAGE_ROLES',
    
    // Book permissions
    'BOOK_CREATE', 'BOOK_READ', 'BOOK_UPDATE', 'BOOK_DELETE', 'BOOK_MANAGE_CATEGORIES',
    
    // Transaction permissions
    'TRANSACTION_CREATE', 'TRANSACTION_READ', 'TRANSACTION_UPDATE', 'TRANSACTION_DELETE', 'TRANSACTION_OVERRIDE',
    
    // Reservation permissions
    'RESERVATION_CREATE', 'RESERVATION_READ', 'RESERVATION_UPDATE', 'RESERVATION_DELETE',
    
    // Report permissions
    'REPORT_VIEW', 'REPORT_GENERATE', 'REPORT_EXPORT',
    
    // System permissions
    'SYSTEM_MAINTENANCE',
  ],
  'LIBRARIAN': [
    'USER_READ',
    'BOOK_CREATE', 'BOOK_READ', 'BOOK_UPDATE',
    'TRANSACTION_CREATE', 'TRANSACTION_READ', 'TRANSACTION_UPDATE',
    'RESERVATION_READ', 'RESERVATION_UPDATE',
    'REPORT_VIEW',
  ],
  'ASSISTANT': [
    'BOOK_READ', 'BOOK_UPDATE',
    'TRANSACTION_READ', 'TRANSACTION_UPDATE',
    'RESERVATION_READ',
  ],
  'MEMBER': [
    'BOOK_READ',
    'TRANSACTION_READ',
    'RESERVATION_CREATE', 'RESERVATION_READ', 'RESERVATION_UPDATE', 'RESERVATION_DELETE',
  ],
  'USER': [
    'BOOK_READ',
    'TRANSACTION_READ',
    'RESERVATION_CREATE', 'RESERVATION_READ', 'RESERVATION_UPDATE', 'RESERVATION_DELETE',
  ],
  'GUEST': [
    'BOOK_READ',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) || false;
}

/**
 * Check if a user has any of the required permissions
 */
export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a user has all of the required permissions
 */
export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return [...(rolePermissions[role] || [])];
}

/**
 * Get all roles that have a specific permission
 */
export function getRolesWithPermission(permission: Permission): UserRole[] {
  return (Object.keys(rolePermissions) as UserRole[]).filter(role => 
    rolePermissions[role].includes(permission)
  );
}
