'use client';

import { useSession } from 'next-auth/react';
import { useMemo, useCallback } from 'react';
import type { UserRole } from '@/types/user-role';
import type { Permission } from '@/types/permissions';
import { getRolePermissions } from '@/lib/permissions-utils';
import { rolePermissions } from '@/lib/rbac';

type UsePermissionsReturn = {
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  canAll: (permissions: Permission[]) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  getPermissions: () => Permission[];
  hasPermission: (permission: Permission) => boolean;
  hasAllPermissions: (...permissions: Permission[]) => boolean;
  hasAnyPermission: (...permissions: Permission[]) => boolean;
  user: any; // TODO: Replace with proper User type
  role: UserRole | undefined;
  isAuthenticated: boolean;
};

/**
 * Hook to check user permissions
 */
export function usePermissions(): UsePermissionsReturn {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userPermissions = session?.user?.permissions;

  // Get user permissions from session or role
  const permissions = useMemo<Permission[]>(() => {
    if (userPermissions && userPermissions.length > 0) {
      return userPermissions as Permission[];
    }
    if (userRole) {
      return rolePermissions[userRole] || [];
    }
    return [];
  }, [userRole, userPermissions]);

  // Check if user has a specific permission
  const checkPermission = useCallback(
    (permission: Permission): boolean => {
      if (!permissions || permissions.length === 0) return false;
      return permissions.includes(permission);
    },
    [permissions]
  );

  // Check if user has all of the specified permissions
  const checkAllPermissions = useCallback(
    (...requiredPermissions: Permission[]): boolean => {
      if (!permissions || permissions.length === 0) return false;
      return requiredPermissions.every(permission => permissions.includes(permission));
    },
    [permissions]
  );

  // Check if user has any of the specified permissions
  const checkAnyPermission = useCallback(
    (...requiredPermissions: Permission[]): boolean => {
      if (!permissions || permissions.length === 0) return false;
      return requiredPermissions.some(permission => permissions.includes(permission));
    },
    [permissions]
  );

  /**
   * Check if the current user has a specific permission
   */
  const can = (permission: Permission): boolean => {
    if (!userRole) return false;
    // First check session permissions if available
    if (session?.user?.permissions?.includes(permission)) {
      return true;
    }
    // Fall back to role-based permissions
    return checkPermission(permission);
  };

  /**
   * Check if the current user has any of the specified permissions
   */
  const canAny = (permissions: Permission[]): boolean => {
    if (!userRole) return false;
    return checkAnyPermission(...permissions);
  };

  /**
   * Check if the current user has all of the specified permissions
   */
  const canAll = (permissions: Permission[]): boolean => {
    if (!userRole) return false;
    return checkAllPermissions(...permissions);
  };

  /**
   * Check if the current user has a specific role
   */
  const hasRole = (role: UserRole): boolean => {
    return userRole === role;
  };

  /**
   * Check if the current user has any of the specified roles
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!userRole) return false;
    return roles.includes(userRole);
  };

  /**
   * Get all permissions for the current user
   */
  const getPermissions = (): Permission[] => {
    return permissions || [];
  };

  /**
   * Check if the current user has all the given permissions
   */
  const hasAll = (permissions: Permission[]): boolean => {
    return checkAllPermissions(...permissions);
  };

  return {
    can,
    canAny,
    canAll,
    hasRole,
    hasAnyRole,
    getPermissions: () => permissions,
    hasPermission: checkPermission,
    hasAllPermissions: checkAllPermissions,
    hasAnyPermission: checkAnyPermission,
    user: session?.user,
    role: userRole,
    isAuthenticated: !!session?.user,
  };
}

/**
 * Hook to check if a specific user (by role) has certain permissions
 */
export function useUserPermissions(role: UserRole) {
  const rolePerms = rolePermissions[role] || [];
  
  /**
   * Check if the specified role has a specific permission
   */
  const can = (permission: Permission): boolean => {
    return rolePerms.includes(permission);
  };

  /**
   * Check if the specified role has any of the specified permissions
   */
  const canAny = (permissions: Permission[]): boolean => {
    return permissions.some(permission => rolePerms.includes(permission));
  };

  /**
   * Check if the specified role has all of the specified permissions
   */
  const canAll = (permissions: Permission[]): boolean => {
    return permissions.every(permission => rolePerms.includes(permission));
  };

  return {
    can,
    canAny,
    canAll,
  };
}
