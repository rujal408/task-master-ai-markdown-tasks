import { UserRole, UserStatus } from '@prisma/client';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXTAUTH_SECRET: string;
      NEXTAUTH_URL: string;
      DATABASE_URL: string;
    }
  }

  // Extend the global Request interface to include user
  interface Request {
    user?: UserWithRoles;
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      status: string;
      permissions?: string[];
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: UserRole;
    status: string;
    permissions?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string | null;
    name?: string | null;
    role: UserRole;
    status: string;
    permissions?: string[];
  }
}

export interface UserWithRoles {
  id: string;
  name: string | null;
  email: string;
  status: UserStatus;
  // For backward compatibility
  role: UserRole;
  // For role-based access control
  roles: Array<{ role: UserRole }>;
  createdAt: Date;
  updatedAt: Date;
  // Add index signature to allow any string key
  [key: string]: any;
}

export {}; // This ensures the file is treated as a module
