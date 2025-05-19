'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@prisma/client';
import type { Permission } from '@/types/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAllPermissions?: boolean;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requireAllPermissions = false,
  redirectTo = '/auth/signin',
  loadingComponent = (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;

    // If user is not authenticated, redirect to login
    if (!session?.user) {
      router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check if user has required role
    if (requiredRoles.length > 0 && !requiredRoles.includes(session.user.role)) {
      router.push('/unauthorized');
      return;
    }

    // TODO: Add permission checks once we have the user's permissions in the session
    // This requires updating the JWT callback to include user permissions
  }, [session, status, router, pathname, requiredRoles, redirectTo]);

  if (status === 'loading') {
    return <>{loadingComponent}</>;
  }

  if (!session?.user) {
    return null; // Will be redirected by the useEffect
  }

  // TODO: Add permission checks here once we have permissions in the session
  
  return <>{children}</>;
}
