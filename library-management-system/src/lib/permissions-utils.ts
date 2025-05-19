import type { UserRole } from '@/types/user-role';
import type { Permission } from '@/types/permissions';
import { rolePermissions } from './rbac';
import { isUserRole } from '@/types/user-role';

// Define the role hierarchy (from highest to lowest)
const roleHierarchy: UserRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'LIBRARIAN',
  'ASSISTANT',
  'MEMBER',
  'USER',
  'GUEST',
];

/**
 * Get permissions for a specific role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Check if a user has the required permissions
 */
export function checkUserPermissions(
  userRole: UserRole | undefined,
  userPermissions: Permission[] | undefined,
  requiredPermissions: Permission[] = [],
  requireAll: boolean = false
): boolean {
  if (!userRole) return false;
  
  // If no permissions are required, allow access
  if (requiredPermissions.length === 0) return true;

  // Check if user has any explicit permissions that match
  const hasExplicitPermission = requireAll
    ? requiredPermissions.every(perm => userPermissions?.includes(perm))
    : requiredPermissions.some(perm => userPermissions?.includes(perm));

  if (hasExplicitPermission) return true;

  // Fall back to role-based permissions
  const roleBasedPermissions = rolePermissions[userRole] || [];
  
  return requireAll
    ? requiredPermissions.every(perm => roleBasedPermissions.includes(perm))
    : requiredPermissions.some(perm => roleBasedPermissions.includes(perm));
}

/**
 * Check if a user has the required role
 */
export function checkUserRole(
  userRole: UserRole | undefined,
  requiredRoles: UserRole[] = []
): boolean {
  if (!userRole || requiredRoles.length === 0) return false;
  return requiredRoles.includes(userRole);
}

/**
 * Get the highest role from a list of roles
 */
export function getHighestRole(roles: UserRole[]): UserRole | null {
  if (roles.length === 0) return null;
  
  // Find the highest role the user has
  for (const role of roleHierarchy) {
    if (roles.includes(role)) {
      return role;
    }
  }
  
  return null;
}
