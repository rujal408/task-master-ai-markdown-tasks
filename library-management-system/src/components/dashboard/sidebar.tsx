"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  BookOpen, 
  Users, 
  Settings, 
  Home, 
  Library, 
  CalendarClock, 
  FileText, 
  User,
  LogOut,
  PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRBAC } from "@/lib/auth/rbac/use-rbac";
import { Permission } from "@/lib/auth/rbac/types";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface SidebarNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requirePermissions?: Permission[];
  adminOnly?: boolean;
  librarianOnly?: boolean;
}

const sidebarNavItems: SidebarNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Books",
    href: "/dashboard/books",
    icon: BookOpen,
  },
  {
    title: "My Loans",
    href: "/dashboard/loans",
    icon: CalendarClock,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Users,
    requirePermissions: [Permission.USER_READ],
    librarianOnly: true,
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: PieChart,
    requirePermissions: [Permission.REPORT_VIEW],
    librarianOnly: true,
  },
  {
    title: "Transactions",
    href: "/dashboard/transactions",
    icon: Library,
    requirePermissions: [Permission.TRANSACTION_READ],
    librarianOnly: true,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    adminOnly: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin, isLibrarian, hasPermission } = useRBAC();
  
  // Filter navigation items based on user roles and permissions
  const filteredNavItems = sidebarNavItems.filter(item => {
    // If no special permissions required, show to all authenticated users
    if (!item.adminOnly && !item.librarianOnly && !item.requirePermissions) {
      return true;
    }
    
    // Admin-only routes
    if (item.adminOnly && !isAdmin) {
      return false;
    }
    
    // Librarian-only routes (and admin can access these too)
    if (item.librarianOnly && !(isLibrarian || isAdmin)) {
      return false;
    }
    
    // Check if user has required permissions
    if (item.requirePermissions && item.requirePermissions.length > 0) {
      return item.requirePermissions.every(permission => hasPermission(permission));
    }
    
    return true;
  });
  
  return (
    <div className="flex flex-col h-screen bg-slate-50 border-r">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-6 w-6" />
          <span className="text-xl">LibraryMS</span>
        </Link>
      </div>
      <nav className="grid items-start px-4 text-sm font-medium flex-1">
        {filteredNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
              pathname === item.href
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 mt-auto border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
