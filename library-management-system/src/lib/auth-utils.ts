"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type UserRole = "ADMIN" | "LIBRARIAN" | "USER";

export const useRequireAuth = (requiredRole?: UserRole) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    // Redirect to signin if not authenticated
    if (!session) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Check if user has the required role
    if (requiredRole && session.user.role !== requiredRole) {
      // Redirect to unauthorized page or dashboard based on user role
      const redirectPath = "/unauthorized";
      router.push(redirectPath);
    }
  }, [session, status, requiredRole, router]);

  return { session, status };
};

export const checkUserRole = (userRole: string, requiredRole: UserRole): boolean => {
  const roleHierarchy: Record<UserRole, number> = {
    USER: 1,
    LIBRARIAN: 2,
    ADMIN: 3,
  };

  return roleHierarchy[userRole as UserRole] >= roleHierarchy[requiredRole];
};

export const getRedirectPathBasedOnRole = (role: string): string => {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "LIBRARIAN":
      return "/librarian/dashboard";
    case "USER":
      return "/member/dashboard";
    default:
      return "/";
  }
};
