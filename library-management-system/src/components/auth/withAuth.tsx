'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { type UserRole } from '@prisma/client';
import type { Permission } from '@/types/permissions';
import { hasAnyPermission } from '@/lib/rbac';

interface WithAuthProps {
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Higher-Order Component for role-based route protection
 */
export function withAuth({
  requiredRole,
  requiredPermissions = [],
  children,
  redirectTo = '/',
}: WithAuthProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    // If no session, redirect to login
    if (!session) {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Check role if required
    if (requiredRole && session.user.role !== requiredRole) {
      router.push(redirectTo);
      return;
    }

    // Check permissions if required
    if (requiredPermissions.length > 0) {
      const hasAccess = hasAnyPermission(session.user.role, requiredPermissions);
      if (!hasAccess) {
        router.push(redirectTo);
      }
    }
  }, [session, status, requiredRole, requiredPermissions, redirectTo, router]);

  if (status === 'loading' || !session) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return <>{children}</>;
}

/**
 * Component wrapper that uses the HOC pattern
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermissions = [],
  redirectTo = '/',
}: Omit<WithAuthProps, 'children'> & { children: React.ReactNode }) {
  return withAuth({ requiredRole, requiredPermissions, redirectTo, children });
}
