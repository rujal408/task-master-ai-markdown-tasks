"use client";

import { useSession } from "next-auth/react";
import { ReactNode } from "react";
import { Permission, UserRole } from "@/lib/auth/rbac/types";
import { hasAnyPermission, hasAnyRole, hasPermission, hasRole } from "@/lib/auth/rbac/roles";
import { UserRole as PrismaUserRole } from '@prisma/client';

interface RoleGuardProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAllPermissions?: boolean;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user roles and permissions
 */
export function RoleGuard({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requireAllPermissions = false,
  fallback = null,
}: RoleGuardProps) {
  const { data: session, status } = useSession();
  
  // If the session is loading, render nothing (or alternatively a loading state)
  if (status === "loading") {
    return null;
  }
  
  // If the user is not authenticated, render the fallback
  if (status !== "authenticated" || !session?.user) {
    return <>{fallback}</>;
  }
  
  const user = session.user as any;
  const userRoles = user.roles || [];
  const userPermissions = user.permissions || [];
  
  // Admin role automatically passes all checks
  if (hasRole(userRoles, PrismaUserRole.ADMIN)) {
    return <>{children}</>;
  }
  
  // Check roles if specified
  if (requiredRoles.length > 0 && !hasAnyRole(userRoles, requiredRoles)) {
    return <>{fallback}</>;
  }
  
  // Check permissions if specified
  if (requiredPermissions.length > 0) {
    const permissionCheck = requireAllPermissions
      ? requiredPermissions.every(permission => hasPermission(userPermissions, permission))
      : hasAnyPermission(userPermissions, requiredPermissions);
    
    if (!permissionCheck) {
      return <>{fallback}</>;
    }
  }
  
  // User passed all checks, render children
  return <>{children}</>;
}

/**
 * Specialized component for admin-only content
 */
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard requiredRoles={[PrismaUserRole.ADMIN]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Specialized component for librarian content
 */
export function LibrarianOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard requiredRoles={[PrismaUserRole.LIBRARIAN, PrismaUserRole.ADMIN]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Component that checks for specific permissions
 */
export function PermissionGuard({
  children,
  permissions,
  requireAll = false,
  fallback = null,
}: {
  children: ReactNode;
  permissions: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard
      requiredPermissions={permissions}
      requireAllPermissions={requireAll}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}
