import { UserRole } from '@prisma/client';
import { Permission, RoleDefinition } from './types';

// Define permissions for each role
export const roleDefinitions: Record<UserRole, RoleDefinition> = {
  [UserRole.ADMIN]: {
    name: UserRole.ADMIN,
    description: 'Full system access',
    permissions: Object.values(Permission), // Admin has all permissions
  },
  
  [UserRole.LIBRARIAN]: {
    name: UserRole.LIBRARIAN,
    description: 'Book and member management, transactions',
    permissions: [
      // Book management
      Permission.BOOK_CREATE,
      Permission.BOOK_READ,
      Permission.BOOK_UPDATE,
      Permission.BOOK_DELETE,
      Permission.BOOK_MANAGE_CATEGORIES,
      
      // User management (limited)
      Permission.USER_READ,
      
      // Transaction management
      Permission.TRANSACTION_CREATE,
      Permission.TRANSACTION_READ,
      Permission.TRANSACTION_UPDATE,
      Permission.TRANSACTION_DELETE,
      
      // Reservation management
      Permission.RESERVATION_CREATE,
      Permission.RESERVATION_READ,
      Permission.RESERVATION_UPDATE,
      Permission.RESERVATION_DELETE,
      
      // Limited reporting
      Permission.REPORT_VIEW,
      Permission.REPORT_GENERATE,
      Permission.REPORT_EXPORT,
    ],
  },
  
  [UserRole.MEMBER]: {
    name: UserRole.MEMBER,
    description: 'Personal profile, book search, reservations',
    permissions: [
      // Personal profile
      Permission.USER_UPDATE_PASSWORD,
      
      // Book browsing
      Permission.BOOK_READ,
      
      // Personal transactions and reservations
      Permission.TRANSACTION_READ,
      Permission.RESERVATION_CREATE,
      Permission.RESERVATION_READ,
      Permission.RESERVATION_UPDATE,
    ],
  },
  
  [UserRole.USER]: {
    name: UserRole.USER,
    description: 'Basic user with minimal permissions',
    permissions: [
      // Basic permissions
      Permission.USER_UPDATE_PASSWORD,
      Permission.BOOK_READ,
    ],
  },
};

// Helper functions for role checking
export const hasRole = (userRoles: UserRole[], role: UserRole): boolean => {
  return userRoles.includes(role);
};

export const hasAnyRole = (userRoles: UserRole[], roles: UserRole[]): boolean => {
  return userRoles.some(role => roles.includes(role));
};

// Helper functions for permission checking
export const getPermissionsForRole = (role: UserRole): Permission[] => {
  return roleDefinitions[role].permissions;
};

export const getPermissionsForRoles = (roles: UserRole[]): Permission[] => {
  const permissions = new Set<Permission>();
  
  roles.forEach(role => {
    roleDefinitions[role].permissions.forEach(permission => {
      permissions.add(permission);
    });
  });
  
  return Array.from(permissions);
};

export const hasPermission = (
  userPermissions: Permission[],
  permission: Permission
): boolean => {
  return userPermissions.includes(permission);
};

export const hasAllPermissions = (
  userPermissions: Permission[],
  permissions: Permission[]
): boolean => {
  return permissions.every(permission => userPermissions.includes(permission));
};

export const hasAnyPermission = (
  userPermissions: Permission[],
  permissions: Permission[]
): boolean => {
  return permissions.some(permission => userPermissions.includes(permission));
};
