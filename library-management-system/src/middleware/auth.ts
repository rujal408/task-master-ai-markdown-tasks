import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { UserWithRoles } from '@/types/auth';
import type { NextRequest } from 'next/server';
import { UserStatus } from '@prisma/client';

type ExtendedRequest = NextRequest & {
  user?: UserWithRoles;
};

type WithAuthHandler<T = any> = (
  req: ExtendedRequest,
  params: T
) => Promise<NextResponse> | NextResponse | Promise<Response> | Response;

export async function withAuth<T = any>(handler: WithAuthHandler<T>) {
  return async (req: Request, params: T) => {
    try {
      // Get the token from the request
      const token = await getToken({ 
        req: req as any, // Type assertion needed for NextRequest
        secret: process.env.NEXTAUTH_SECRET 
      });

      // Check if user is authenticated
      if (!token?.sub) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Get user from database with roles
      const user = await prisma.user.findUnique({
        where: { id: token.sub },
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

      // Map to UserWithRoles type
      const userWithRoles: UserWithRoles = {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        role: user.role,
        roles: (user as any).userRoles?.map((ur: any) => ({ role: ur.role })) || [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      if (userWithRoles.status !== UserStatus.ACTIVE) {
        return NextResponse.json(
          { error: 'Account is inactive or does not exist' },
          { status: 403 }
        );
      }

      // Add user to the request object
      const extendedReq = req as ExtendedRequest;
      extendedReq.user = userWithRoles;
      return handler(extendedReq, params);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

export function withRole(role: UserRole) {
  return function <T = any>(handler: WithAuthHandler<T>) {
    return withAuth<T>(async (req, params) => {
      // Get user from the request
      const extendedReq = req as ExtendedRequest;
      if (!extendedReq.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      const user = extendedReq.user;

      // Check if user has the required role
      const hasRole = user.roles.some((r) => r.role === role);

      if (!hasRole) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
      return handler(req, params);
    });
  };
}

export function withPermission(requiredPermission: string) {
  return function <T = any>(handler: WithAuthHandler<T>) {
    return withAuth<T>(async (req, params) => {
      try {
        // Get user from the request
        const extendedReq = req as ExtendedRequest;
        if (!extendedReq.user) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }
        const user = extendedReq.user;

        // Get all permissions for the user's roles
        const roles = user.roles?.map((r) => r.role) || [user.role];
        
        // Get role permissions from the database
        const permissions = await prisma.rolePermission.findMany({
          where: {
            role: {
              in: roles
            }
          },
          select: {
            permission: true
          },
          distinct: ['permission']
        });

        // Check if user has the required permission
        const hasPermission = permissions.some(
          (p) => p.permission === requiredPermission
        );

        if (!hasPermission) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }

        return handler(extendedReq, params);
      } catch (error) {
        console.error('Permission check error:', error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    });
  };
}
