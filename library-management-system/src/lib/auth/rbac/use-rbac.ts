"use client";

import { useSession } from "next-auth/react";
import { Permission, UserRole } from "./types";
import { hasAnyPermission, hasAnyRole, hasPermission, hasRole } from "./roles";
import { UserRole as PrismaUserRole } from '@prisma/client';
import { SessionUser } from "./middleware";

/**
 * Hook to use role-based access control in React components
 */
export function useRBAC() {
  const { data: session, status } = useSession();
  
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const sessionUser = session?.user as any;
  
  const userRoles: UserRole[] = sessionUser?.roles || [];
  const userPermissions: Permission[] = sessionUser?.permissions || [];
  
  // Role checking functions
  const checkHasRole = (role: UserRole): boolean => {
    if (!isAuthenticated) return false;
    return hasRole(userRoles, role);
  };
  
  const checkHasAnyRole = (roles: UserRole[]): boolean => {
    if (!isAuthenticated) return false;
    return hasAnyRole(userRoles, roles);
  };
  
  // Common role shortcuts
  const isAdmin = checkHasRole(PrismaUserRole.ADMIN);
  const isLibrarian = checkHasRole(PrismaUserRole.LIBRARIAN);
  const isMember = checkHasRole(PrismaUserRole.MEMBER);
  
  // Permission checking functions
  const checkHasPermission = (permission: Permission): boolean => {
    if (!isAuthenticated) return false;
    // Admin role bypasses permission checks
    if (isAdmin) return true;
    return hasPermission(userPermissions, permission);
  };
  
  const checkHasAllPermissions = (permissions: Permission[]): boolean => {
    if (!isAuthenticated) return false;
    // Admin role bypasses permission checks
    if (isAdmin) return true;
    return permissions.every(permission => hasPermission(userPermissions, permission));
  };
  
  const checkHasAnyPermission = (permissions: Permission[]): boolean => {
    if (!isAuthenticated) return false;
    // Admin role bypasses permission checks
    if (isAdmin) return true;
    return hasAnyPermission(userPermissions, permissions);
  };
  
  return {
    isLoading: status === "loading",
    isAuthenticated,
    userRoles,
    userPermissions,
    // Role checking
    hasRole: checkHasRole,
    hasAnyRole: checkHasAnyRole,
    isAdmin,
    isLibrarian,
    isMember,
    // Permission checking
    hasPermission: checkHasPermission,
    hasAllPermissions: checkHasAllPermissions,
    hasAnyPermission: checkHasAnyPermission,
  };
}
