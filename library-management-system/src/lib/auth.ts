import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient, User as PrismaUser, UserRole } from "@prisma/client";
import { AuthOptions, DefaultSession, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

// Extend the built-in session types
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
      status: string;
      permissions?: string[];
    } & DefaultSession["user"];
  }

  // Extend the default User type from next-auth with our custom fields
  interface User {
    id: string;
    image?: string | null;
    role: UserRole;
    status: string;
    permissions?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    status: string;
  }
}

export const authOptions: AuthOptions = {
  // @ts-ignore - PrismaAdapter has type issues with latest next-auth
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        if (user.status !== 'ACTIVE') {
          throw new Error("Your account is not active. Please contact support.");
        }

        // Ensure all required fields are present
        if (!user.id || !user.email) {
          throw new Error("User data is incomplete");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: user.role,
          status: user.status,
        } as NextAuthUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Ensure all required fields are present
        if (!user.id || !user.role || !user.status) {
          throw new Error('User data is incomplete');
        }
        
        return {
          ...token,
          id: user.id,
          role: user.role,
          status: user.status,
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = token.role as UserRole;
          session.user.status = token.status as string;
        }
      }
      return session;
    },
  },
};
