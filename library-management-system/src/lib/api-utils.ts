import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { UserRole, UserStatus } from "@prisma/client";

// Import the UserWithRoles type from the auth types
import type { UserWithRoles } from '@/types/auth';

// Re-export the type for consistency
export type { UserWithRoles };

// Extend the Next.js request type to include the user property
declare global {
  namespace NextApiRequest {
    interface User extends UserWithRoles {}
  }
}

type ApiHandler<T = any> = (
  req: NextRequest & { user?: UserWithRoles },
  params: T
) => Promise<NextResponse> | NextResponse | Promise<Response> | Response;

// Type for the user with roles and permissions from Prisma
interface UserWithRolesAndPermissions {
  id: string;
  name: string | null;
  email: string;
  status: UserStatus;
  role: UserRole;
  userRoles?: Array<{
    role: UserRole;
    roleData?: {
      permissions: Array<{
        permission: string;
      }>;
    };
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to get all permissions for a user
export const getUserPermissions = async (userId: string): Promise<string[]> => {
  const userWithRoles = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          roleData: {
            include: {
              permissions: true
            }
          }
        }
      }
    }
  }) as unknown as UserWithRolesAndPermissions | null;

  if (!userWithRoles) {
    return [];
  }

  // Get all unique permissions from all roles
  const permissions = new Set<string>();
  
  // Add the user's direct role as a permission
  if (userWithRoles.role) {
    permissions.add(userWithRoles.role);
  }

  // Add permissions from role mappings
  if (userWithRoles.userRoles) {
    userWithRoles.userRoles.forEach((roleMapping: { role: UserRole; roleData?: { permissions: Array<{ permission: string }> } }) => {
      // Add the role itself as a permission
      permissions.add(roleMapping.role);
      
      // Add permissions from role data if available
      if (roleMapping.roleData?.permissions) {
        roleMapping.roleData.permissions.forEach((permission: { permission: string }) => {
          permissions.add(permission.permission);
        });
      }
    });
  }

  return Array.from(permissions);
};

// Helper function to check if a user has a specific role
export const hasRole = (user: UserWithRoles, role: UserRole): boolean => {
  // Check direct role first
  if (user.role === role) return true;
  
  // Check if user has the role in their roles
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.some(r => r.role === role);
  }
  
  return false;
};

// Helper function to check if a user has all required permissions
export const hasAllPermissions = (user: UserWithRoles, requiredPermissions: string[]): boolean => {
  if (!user.role) return false;
  
  // For now, just check if the user has the required role
  // We'll implement proper permission checking later
  return true;
};

export async function requireAuth<T = any>(
  handler: ApiHandler<T>,
  req: NextRequest & { user?: UserWithRoles },
  params: T
) {
  try {
    // Get the session from the request
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user with roles from the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        userRoles: {
          select: {
            role: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'User account is not active' },
        { status: 403 }
      );
    }

    // Create user object with roles
    const userWithRoles = {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status as UserStatus,
      role: user.role, // For backward compatibility
      // Map userRoles to the roles array if available
      roles: user.userRoles ? user.userRoles.map((ur: { role: UserRole }) => ({ role: ur.role })) : [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    } as UserWithRoles;

    // Add user to request object
    req.user = userWithRoles;

    return handler(req, params);
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function requireRole<T = any>(
  role: UserRole,
  handler: ApiHandler<T>,
  req: NextRequest & { user?: UserWithRoles },
  params: T
) {
  // First, authenticate the user
  const authResponse = await requireAuth(handler, req, params);

  // If there was an auth error, return it
  if (authResponse.status !== 200) {
    return authResponse;
  }

  // Get user from the request
  const user = req.user;
  if (!user) {
    return NextResponse.json(
      { error: 'User not found in request' },
      { status: 401 }
    );
  }

  // Check if user has the required role
  if (!hasRole(user, role)) {
    return NextResponse.json(
      { error: 'Forbidden - Insufficient permissions' },
      { status: 403 }
    );
  }

  return handler(req, params);
}

export async function requirePermission<T = any>(
  permission: string,
  handler: ApiHandler<T>,
  req: NextRequest,
  params: T
) {
  // First, authenticate the user
  const authResponse = await requireAuth(handler, req, params);

  // If there was an auth error, return it
  if (authResponse.status !== 200) {
    return authResponse;
  }

  // Get user from the request
  const user = (req as NextRequest & { user: UserWithRoles }).user!;

  // Get all permissions for the user's roles
  const roles = user.roles.map((r: { role: UserRole }) => r.role);
  
  const rolePermissions = await prisma.rolePermission.findMany({
    where: {
      role: { in: roles as any[] }
    },
    select: {
      permission: true
    },
    distinct: ['permission']
  });

  // Check if user has the required permission
  const hasPermission = rolePermissions.some(
    (rp: { permission: string }) => rp.permission === permission
  );

  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  return handler(req, params);
}
