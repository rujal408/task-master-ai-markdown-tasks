import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import type { Permission } from "@/types/permissions";
import { checkUserPermissions, checkUserRole } from "@/lib/permissions-utils";

// Type for route protection rules
type RouteProtection = {
  path: string;
  roles?: UserRole[];
  permissions?: Permission[];
  requireAllPermissions?: boolean;
};

// Define the protected routes and their required roles/permissions
const protectedRoutes: RouteProtection[] = [
  // Admin routes - full system access
  {
    path: "/admin",
    roles: [UserRole.ADMIN],
  },
  // Librarian routes - book and member management
  {
    path: "/librarian",
    roles: [UserRole.ADMIN, UserRole.LIBRARIAN],
  },
  // Member routes - user-specific features
  {
    path: "/member",
    roles: [UserRole.ADMIN, UserRole.LIBRARIAN, UserRole.USER],
  },
  // Public routes that still need authentication
  {
    path: "/dashboard",
    roles: [UserRole.ADMIN, UserRole.LIBRARIAN, UserRole.USER],
  },
  // Example of permission-based route
  {
    path: "/reports",
    permissions: ["REPORT_VIEW", "REPORT_GENERATE"],
    requireAllPermissions: false,
  },
];

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/auth/signin",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/api/auth/[...nextauth]",
  "/_next",
  "/favicon.ico",
];

/**
 * Check if user has required permissions for a route
 */
export async function checkPermissions(
  userRole: UserRole | undefined,
  userPermissions: string[] = [],
  requiredPermissions: Permission[] = [],
  requireAll: boolean = false
): Promise<boolean> {
  if (!userRole) return false;
  
  // If no permissions are required, allow access
  if (requiredPermissions.length === 0) return true;
  
  // Check permissions using our utility function
  return checkUserPermissions(
    userRole,
    userPermissions as Permission[],
    requiredPermissions,
    requireAll
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Get the token from the request
  const token = await getToken({ req: request });
  
  // If there's no token and the route is protected, redirect to login
  if (!token) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  
  // Get user info from the token
  const userRole = token.role as UserRole | undefined;
  const userPermissions = (token as any).permissions as string[] | undefined;
  
  // If the user has no role, deny access
  if (!userRole) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  // Find the matching route protection rules
  const routeProtection = protectedRoutes.find(r => pathname.startsWith(r.path));
  
  // If no specific protection rules, allow access
  if (!routeProtection) {
    return NextResponse.next();
  }
  
  // Check role-based access
  if (routeProtection.roles && routeProtection.roles.length > 0) {
    const hasRequiredRole = checkUserRole(userRole, routeProtection.roles);
    if (!hasRequiredRole) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
  
  // Check permission-based access
  if (routeProtection.permissions && routeProtection.permissions.length > 0) {
    const hasPermission = await checkPermissions(
      userRole,
      userPermissions,
      routeProtection.permissions,
      routeProtection.requireAllPermissions
    );
    
    if (!hasPermission) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
  
  // If we get here, the user has the required access
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
