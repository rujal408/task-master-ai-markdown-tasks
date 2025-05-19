"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRBAC } from "@/lib/auth/rbac/use-rbac";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOnly } from "@/components/auth/role-guard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Shield, BookOpen, Users, Bell } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { isAdmin, isLoading } = useRBAC();
  
  // Redirect non-admin users who try to access this page directly
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isLoading, isAdmin, router]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <AdminOnly fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Shield className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">You don't have permission to access this page</p>
        <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
      </div>
    }>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage system settings and configurations.
          </p>
        </div>
        
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="books">Book Settings</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>View system information and statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">System Version</p>
                    <p className="text-sm text-muted-foreground">1.0.0-beta</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Last Updated</p>
                    <p className="text-sm text-muted-foreground">May 15, 2025</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Database Status</p>
                    <p className="text-sm text-muted-foreground">Connected</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Admin Users</p>
                    <p className="text-sm text-muted-foreground">1</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Check for Updates</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Maintenance</CardTitle>
                <CardDescription>Perform system maintenance tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 gap-4">
                  <Button variant="outline" className="w-full">
                    Clear System Cache
                  </Button>
                  <Button variant="outline" className="w-full">
                    Run Database Optimization
                  </Button>
                  <Button variant="outline" className="w-full">
                    Backup Database
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user accounts and permissions</CardDescription>
                </div>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  This section allows administrators to manage user accounts, roles, 
                  and permissions. You can create new accounts, reset passwords, 
                  and configure user access rights.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Go to User Management</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="books" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Book Management Settings</CardTitle>
                  <CardDescription>Configure book-related settings</CardDescription>
                </div>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Configure book categories, loan periods, fine rates, 
                  and reservation policies. These settings affect how users 
                  can borrow and reserve books.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Configure Book Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Configure system-wide notifications</CardDescription>
                </div>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Configure email templates, notification schedules, and system alerts.
                  These settings control how users receive notifications about loans,
                  reservations, and important system events.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Configure Notifications</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminOnly>
  );
}
