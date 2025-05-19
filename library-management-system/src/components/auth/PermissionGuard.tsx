'use client';

import { ReactNode } from 'react';
import { type UserRole } from '@prisma/client';
import type { Permission } from '@/types/permissions';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  children: ReactNode;
  /**
   * Required permissions (user must have at least one)
   */
  permissions?: Permission[];
  /**
   * Required role (user must have this exact role)
   */
  role?: UserRole;
  /**
   * Required roles (user must have at least one of these roles)
   */
  roles?: UserRole[];
  /**
   * Render fallback if permission/role check fails
   */
  fallback?: ReactNode | null;
  /**
   * If true, checks that user has ALL specified permissions
   * @default false
   */
  requireAllPermissions?: boolean;
}

/**
 * Component that renders children only if the current user has the required permissions/roles
 */
export function PermissionGuard({
  children,
  permissions = [],
  role,
  roles = [],
  fallback = null,
  requireAllPermissions = false,
}: PermissionGuardProps) {
  const { can, canAny, canAll, hasRole, hasAnyRole } = usePermissions();

  // Check role-based access first
  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }


  // Check roles-based access
  if (roles.length > 0 && !hasAnyRole(roles)) {
    return <>{fallback}</>;
  }


  // Check permission-based access
  if (permissions.length > 0) {
    const hasPermission = requireAllPermissions
      ? canAll(permissions)
      : canAny(permissions);

    if (!hasPermission) {
      return <>{fallback}</>;
    }
  }


  // If no permissions or roles are specified, or all checks pass, render children
  return <>{children}</>;
}

/**
 * Shortcut for checking a single permission
 */
export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode | null;
}) {
  const { can } = usePermissions();
  return <>{can(permission) ? children : fallback}</>;
}

/**
 * Shortcut for checking a single role
 */
export function HasRole({
  role,
  children,
  fallback = null,
}: {
  role: UserRole;
  children: ReactNode;
  fallback?: ReactNode | null;
}) {
  const { hasRole } = usePermissions();
  return <>{hasRole(role) ? children : fallback}</>;
}
