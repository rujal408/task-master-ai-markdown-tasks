// lib/auth.ts

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { compare } from 'bcryptjs';
import { UserRole, UserStatus } from '@prisma/client';
import { Permission } from './auth/rbac/types';
import { enhanceSessionWithRBAC, getUserPermissions, getUserRoles } from './auth/rbac/auth-utils';
import { JWT } from 'next-auth/jwt';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find the user by email
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            userRoles: {
              include: {
                roleData: true
              }
            }
          }
        });

        if (!user) {
          return null;
        }

        if (user.status !== UserStatus.ACTIVE) {
          return null; // Don't authenticate inactive users
        }

        // Check if the password matches
        const passwordValid = await compare(credentials.password, user.passwordHash);
        if (!passwordValid) {
          return null;
        }

        // Get all user roles (primary role + additional roles)
        const userRoles = await getUserRoles(user.id);
        
        // Get all permissions for these roles
        const permissions = await getUserPermissions(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: user.role,         // Primary role from the user model
          roles: userRoles.map(role => ({ role })), // Convert to { role: UserRole }[] format
          status: user.status,
          permissions: permissions // Array of all permissions
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT, user: any }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        
        // Ensure roles is always an array with the correct structure { role: UserRole }[]
        if (user.roles) {
          token.roles = user.roles; // Already in correct format from authorize function
        } else {
          token.roles = [{ role: user.role }]; // Convert to correct format
        }
        
        token.status = user.status;
        token.permissions = user.permissions || [];
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as UserRole;
        session.user.status = token.status as string;
        session.user.permissions = token.permissions as Permission[];
        
        // Enhance session with up-to-date roles and permissions
        // This ensures the session always has the latest RBAC info
        session = await enhanceSessionWithRBAC(session, token.id as string);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
