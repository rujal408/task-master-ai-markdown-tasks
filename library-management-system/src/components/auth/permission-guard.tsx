'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import type { Permission } from '@/types/permissions';

interface PermissionGuardProps {
  children: ReactNode;
  permissions: Permission | Permission[];
  requireAll?: boolean;
  fallback?: ReactNode | null;
}

export function PermissionGuard({
  children,
  permissions,
  requireAll = false,
  fallback = null,
}: PermissionGuardProps) {
  const { can, canAny, canAll } = usePermissions();
  
  const permissionsArray = Array.isArray(permissions) ? permissions : [permissions];
  
  const hasPermission = requireAll 
    ? canAll(permissionsArray)
    : canAny(permissionsArray);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Helper components for common permission checks
export function Can({ permission, children, fallback = null }: { permission: Permission, children: ReactNode, fallback?: ReactNode | null }) {
  return (
    <PermissionGuard permissions={permission} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function CanAll({ permissions, children, fallback = null }: { permissions: Permission[], children: ReactNode, fallback?: ReactNode | null }) {
  return (
    <PermissionGuard permissions={permissions} requireAll fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function CanAny({ permissions, children, fallback = null }: { permissions: Permission[], children: ReactNode, fallback?: ReactNode | null }) {
  return (
    <PermissionGuard permissions={permissions} requireAll={false} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}
