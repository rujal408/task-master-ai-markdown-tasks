import { prisma } from "@/lib/prisma";
import { Permission } from "./types";
import { getPermissionsForRoles } from "./roles";
import { UserRole as PrismaUserRole } from '@prisma/client';

/**
 * Fetches user roles from the database
 */
export async function getUserRoles(userId: string): Promise<PrismaUserRole[]> {
  try {
    // Fetch the primary role from the user table
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Fetch additional roles from the user_role_mappings table
    const roleMappings = await prisma.userRoleMapping.findMany({
      where: { userId },
      select: { role: true },
    });

    // Combine the primary role with additional roles
    const roles: PrismaUserRole[] = user ? [user.role] : [];
    roleMappings.forEach(mapping => {
      if (!roles.includes(mapping.role)) {
        roles.push(mapping.role);
      }
    });

    return roles;
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return [];
  }
}

/**
 * Gets all permissions for a user based on their roles
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  try {
    const roles = await getUserRoles(userId);
    
    // Get all permissions for these roles
    const permissions = getPermissionsForRoles(roles);
    
    return permissions;
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return [];
  }
}

/**
 * Updates auth session with roles and permissions
 */
export async function enhanceSessionWithRBAC(session: any, userId: string) {
  try {
    if (!session || !userId) return session;
    
    // Get roles for this user
    const roles = await getUserRoles(userId);
    
    // Get permissions for these roles
    const permissions = getPermissionsForRoles(roles);
    
    // Add roles and permissions to session
    session.user.roles = roles;
    session.user.permissions = permissions;
    
    return session;
  } catch (error) {
    console.error("Error enhancing session with RBAC:", error);
    return session;
  }
}
