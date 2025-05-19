import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

// Dashboard Layout and Components
import { DashboardLayout, Widget } from "@/components/dashboard/dashboard-layout";
import { BooksCheckedOutWidget } from "@/components/dashboard/widgets/books-checked-out-widget";
import { OverdueBooksWidget } from "@/components/dashboard/widgets/overdue-books-widget";
import { ActiveMembersWidget } from "@/components/dashboard/widgets/active-members-widget";
import { PopularBooksWidget } from "@/components/dashboard/widgets/popular-books-widget";
import { ActivityFeedWidget } from "@/components/dashboard/widgets/activity-feed-widget";
import { QuickActionsWidget } from "@/components/dashboard/widgets/quick-actions-widget";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Determine user role from session
  const userRole = session.user.role || 'MEMBER';

  // Define default dashboard layout based on user role
  const dashboardLayout: Widget[] = [
    // Common widgets for all roles
    {
      id: "popular-books",
      type: "popular-books",
      title: "Popular Books",
      size: "medium" as const,
      position: 4,
      collapsed: false,
    },
    
    // Admin and Librarian specific widgets
    ...(userRole === 'ADMIN' || userRole === 'LIBRARIAN' ? [
      {
        id: "books-checked-out",
        type: "books-checked-out",
        title: "Books Checked Out Today",
        size: "small" as const,
        position: 0,
        collapsed: false,
      },
      {
        id: "active-members",
        type: "active-members",
        title: "Active Members",
        size: "small" as const,
        position: 1,
        collapsed: false,
      },
      {
        id: "overdue-books",
        type: "overdue-books",
        title: "Overdue Books",
        size: "medium" as const,
        position: 2,
        collapsed: false,
      },
      {
        id: "activity-feed",
        type: "activity-feed",
        title: "Recent Activity",
        size: "large" as const,
        position: 5,
        collapsed: false,
      },
    ] : []),
    
    // Quick actions for all users
    {
      id: "quick-actions",
      type: "quick-actions",
      title: "Quick Actions",
      size: "medium" as const,
      position: 3,
      collapsed: false,
    },
  ];

  // Map widget types to components
  const widgetComponents = {
    'books-checked-out': BooksCheckedOutWidget,
    'overdue-books': OverdueBooksWidget,
    'active-members': ActiveMembersWidget,
    'popular-books': PopularBooksWidget,
    'activity-feed': ActivityFeedWidget,
    'quick-actions': QuickActionsWidget,
  };

  return (
    <DashboardLayout 
      defaultLayout={dashboardLayout}
      userRole={userRole}
      widgets={widgetComponents}
    />
  );
}
