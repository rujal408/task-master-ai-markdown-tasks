import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Permission, UserRole } from './types';
import { hasAnyPermission, hasAnyRole, hasPermission, hasRole } from './roles';
import { UserRole as PrismaUserRole } from '@prisma/client';

// Define the session user interface with required fields for middleware
export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  roles: UserRole[];
  permissions: Permission[];
  image?: string | null;
}

export interface RouteProtectionOptions {
  requireAuth?: boolean;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAllPermissions?: boolean;
}

// Default options if not specified
const defaultOptions: RouteProtectionOptions = {
  requireAuth: true,
  requiredRoles: [],
  requiredPermissions: [],
  requireAllPermissions: false,
};

/**
 * Middleware to protect API routes based on authentication, roles, and permissions
 */
export async function withRoleProtection(
  req: NextRequest,
  handler: (req: NextRequest, user: SessionUser) => Promise<NextResponse>,
  options: RouteProtectionOptions = {}
): Promise<NextResponse> {
  // Merge provided options with defaults
  const { requireAuth, requiredRoles, requiredPermissions, requireAllPermissions } = {
    ...defaultOptions,
    ...options,
  };

  try {
    // Get current session
    const session = await getServerSession(authOptions);

    // Check if authentication is required
    if (requireAuth && (!session || !session.user)) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // If there's a session and it has user info, proceed with role checks
    if (session?.user) {
      // Convert session user to SessionUser type with roles and permissions
      const sessionUser = session.user as any;
      const user: SessionUser = {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        roles: sessionUser.roles || [sessionUser.role], // Ensure roles is always an array
        permissions: sessionUser.permissions || [],
        image: sessionUser.image,
      };

      // Check roles if specified
      if (requiredRoles && requiredRoles.length > 0) {
        // Special case: ADMIN role bypasses other role checks
        if (!hasRole(user.roles, PrismaUserRole.ADMIN) && !hasAnyRole(user.roles, requiredRoles)) {
          return NextResponse.json(
            { error: 'Insufficient role permissions' },
            { status: 403 }
          );
        }
      }

      // Check permissions if specified
      if (requiredPermissions && requiredPermissions.length > 0) {
        // Special case: ADMIN role bypasses permission checks
        if (!hasRole(user.roles, PrismaUserRole.ADMIN)) {
          const hasRequiredPermissions = requireAllPermissions
            ? requiredPermissions.every(permission => hasPermission(user.permissions, permission))
            : hasAnyPermission(user.permissions, requiredPermissions);

          if (!hasRequiredPermissions) {
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            );
          }
        }
      }

      // User passed all checks, proceed with the handler
      return await handler(req, user);
    }

    // If no authentication required and no session, just proceed
    if (!requireAuth) {
      return await handler(req, {} as SessionUser);
    }

    // Fallback response (should not reach here if options are properly configured)
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error in role protection middleware:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
