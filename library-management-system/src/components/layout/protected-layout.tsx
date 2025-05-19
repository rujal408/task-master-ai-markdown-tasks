"use client";

import { useEffect } from "react";
import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRBAC } from "@/lib/auth/rbac/use-rbac";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOnly } from "@/components/auth/role-guard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Shield, BookOpen, Users, Bell } from "lucide-react";
import { useAriaLive } from "@/lib/accessibility";
import { getRedirectPathBasedOnRole } from "@/lib/auth-utils";

type ProtectedLayoutProps = {
  children: ReactNode;
  requiredRole?: "ADMIN" | "LIBRARIAN" | "USER";
};

export default function ProtectedLayout({
  children,
  requiredRole = "USER",
}: ProtectedLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { announce } = useAriaLive("assertive");

  useEffect(() => {
    if (status === "loading") {
      announce("Loading user session...");
    } else if (!session) {
      announce("You need to be signed in to view this page.");
    } else if (roleHierarchy[session.user.role as keyof typeof roleHierarchy] < roleHierarchy[requiredRole]) {
      announce("You don't have permission to access this page.");
    }
  }, [status, session, requiredRole, announce]);

  if (status === "loading") {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        role="status"
        aria-label="Loading user session"
      >
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
        <span className="sr-only">Loading user session...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4"
        role="alert"
        aria-live="assertive"
      >
        <div className="max-w-md w-full space-y-4 text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You need to be signed in to view this page.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Button onClick={() => router.push("/auth/signin")}>
              Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/auth/register")}
            >
              Create Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has the required role
  const userRole = session.user.role as "ADMIN" | "LIBRARIAN" | "USER";
  const roleHierarchy = {
    USER: 1,
    LIBRARIAN: 2,
    ADMIN: 3,
  };

  if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4"
        role="alert"
        aria-live="assertive"
      >
        <div className="max-w-md w-full space-y-4 text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don&apos;t have permission to access this page.
          </p>
          <Button
            onClick={() =>
              router.push(getRedirectPathBasedOnRole(userRole))
            }
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
