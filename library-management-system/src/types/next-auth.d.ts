import type { DefaultSession } from 'next-auth';
import type { UserRole } from './user-role';
import type { Permission } from './permissions';

declare module 'next-auth' {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      id: string;
      role: UserRole;
      roles: { role: UserRole }[];
      status: string;
      permissions?: Permission[];
    } & DefaultSession['user'];
  }

  /**
   * Extend the built-in user types
   */
  interface User {
    id: string;
    role: UserRole;
    roles: { role: UserRole }[];
    status: string;
    permissions?: Permission[];
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extend the built-in JWT types
   */
  interface JWT {
    id: string;
    role: UserRole;
    roles: { role: UserRole }[];
    status: string;
    permissions?: Permission[];
  }
}
