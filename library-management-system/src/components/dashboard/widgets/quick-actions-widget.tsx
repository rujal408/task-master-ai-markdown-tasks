'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, BookOpen, Users, Calendar, Settings, ArrowRight, Edit, Upload } from 'lucide-react';
import { Widget } from '../dashboard-layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Define a simple useLocalStorage hook if not already imported
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        setStoredValue(item ? JSON.parse(item) : initialValue);
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      setStoredValue(initialValue);
    }
  }, [initialValue, key]);

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

// Define user role type and helper functions
type UserRole = 'ADMIN' | 'LIBRARIAN' | 'MEMBER';

// Type guard function to check if a value is a valid UserRole
function isUserRole(role: string): role is UserRole {
  return ['ADMIN', 'LIBRARIAN', 'MEMBER'].includes(role as UserRole);
}

// Define action types with role restrictions
interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  roles: UserRole[];
  description: string;
}

// All possible quick actions
const allActions: ActionItem[] = [
  {
    id: 'add-book',
    label: 'Add Book',
    icon: <Plus className="h-4 w-4" />,
    href: '/dashboard/books/new',
    roles: ['ADMIN', 'LIBRARIAN'],
    description: 'Add a new book to the library catalog'
  },
  {
    id: 'upload-files',
    label: 'Upload Files',
    icon: <Upload className="h-4 w-4" />,
    href: '/dashboard/uploads',
    roles: ['ADMIN', 'LIBRARIAN', 'MEMBER'],
    description: 'Upload book covers or profile images'
  },
  {
    id: 'checkout-book',
    label: 'Checkout Book',
    icon: <BookOpen className="h-4 w-4" />,
    href: '/dashboard/borrowings?tab=checkout',
    roles: ['ADMIN', 'LIBRARIAN'],
    description: 'Process a new book checkout'
  },
  {
    id: 'return-book',
    label: 'Return Book',
    icon: <ArrowRight className="h-4 w-4" />,
    href: '/dashboard/borrowings?tab=return',
    roles: ['ADMIN', 'LIBRARIAN'],
    description: 'Process a book return'
  },
  {
    id: 'manage-members',
    label: 'Manage Members',
    icon: <Users className="h-4 w-4" />,
    href: '/dashboard/members',
    roles: ['ADMIN', 'LIBRARIAN'],
    description: 'View and manage library members'
  },
  {
    id: 'search-catalog',
    label: 'Search Catalog',
    icon: <Search className="h-4 w-4" />,
    href: '/dashboard/books',
    roles: ['ADMIN', 'LIBRARIAN', 'MEMBER'],
    description: 'Search the library catalog'
  },
  {
    id: 'view-calendar',
    label: 'View Calendar',
    icon: <Calendar className="h-4 w-4" />,
    href: '/dashboard/calendar',
    roles: ['ADMIN', 'LIBRARIAN'],
    description: 'View library events and due dates'
  },
  {
    id: 'my-books',
    label: 'My Books',
    icon: <BookOpen className="h-4 w-4" />,
    href: '/dashboard/my-books',
    roles: ['MEMBER'],
    description: 'View your checked out books'
  },
  {
    id: 'my-profile',
    label: 'My Profile',
    icon: <Users className="h-4 w-4" />,
    href: '/dashboard/profile',
    roles: ['ADMIN', 'LIBRARIAN', 'MEMBER'],
    description: 'View and edit your profile'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="h-4 w-4" />,
    href: '/dashboard/settings',
    roles: ['ADMIN'],
    description: 'Configure system settings'
  }
];

interface QuickActionsWidgetProps {
  widget: Widget;
}

export function QuickActionsWidget({ widget }: QuickActionsWidgetProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Define explicitly as a constant literal type to avoid TypeScript comparison issues
  const userRole = 'LIBRARIAN' as const;
  
  // Get actions available for the current user role
  const availableActions = allActions.filter(action => 
    action.roles.some(role => role === userRole)
  );
  
  // Storage key for user's selected quick actions
  const storageKey = `quick-actions-${userRole}`;
  
  // Default actions for each role
  const getDefaultActions = (): string[] => {
    // Use a direct lookup approach instead of switch statement to avoid TypeScript comparison issues
    const defaultActionsByRole = {
      'ADMIN': ['add-book', 'upload-files', 'checkout-book', 'return-book', 'manage-members', 'settings'],
      'LIBRARIAN': ['add-book', 'upload-files', 'checkout-book', 'return-book', 'search-catalog'],
      'MEMBER': ['search-catalog', 'upload-files', 'my-books', 'my-profile']
    };
    
    // Return the actions for the current role or a fallback
    return defaultActionsByRole[userRole] || ['search-catalog'];
  };
  
  // Get user's selected actions from local storage
  const [selectedActionIds, setSelectedActionIds] = useLocalStorage<string[]>(
    storageKey,
    getDefaultActions()
  );
  
  // Selected actions
  const selectedActions = availableActions.filter(action => 
    selectedActionIds.includes(action.id)
  );
  
  // Toggle a quick action
  const toggleQuickAction = (actionId: string) => {
    if (selectedActionIds.includes(actionId)) {
      setSelectedActionIds(selectedActionIds.filter((id: string) => id !== actionId));
    } else {
      setSelectedActionIds([...selectedActionIds, actionId]);
    }
  };
  
  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Quick Actions</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Edit className="h-4 w-4" />
              <span className="sr-only">Customize</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Customize Quick Actions</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-500 mb-4">
                Select the actions you want to appear in your Quick Actions panel.
              </p>
              <div className="space-y-3">
                {availableActions.map((action) => (
                  <div key={action.id} className="flex items-start space-x-2">
                    <Checkbox 
                      id={`action-${action.id}`}
                      checked={selectedActionIds.includes(action.id)}
                      onCheckedChange={() => toggleQuickAction(action.id)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label 
                        htmlFor={`action-${action.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {action.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {selectedActions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            className="justify-start h-auto py-3"
            onClick={() => router.push(action.href)}
          >
            <div className="flex flex-col items-start gap-0">
              <div className="flex items-center text-xs font-medium">
                {action.icon}
                <span className="ml-2">{action.label}</span>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
