'use client';

import { useEffect, useState, useRef } from 'react';
import { Activity, BookOpen, User, RotateCw, Filter } from 'lucide-react';
import { Widget } from '../dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ActivityItem {
  id: string;
  type: 'CHECKOUT' | 'RETURN' | 'OVERDUE' | 'MEMBER_SIGNUP' | 'BOOK_ADDED';
  timestamp: string;
  title: string;
  description: string;
  user?: string;
  userId?: string;
  bookId?: string;
  memberId?: string;
}

interface ActivityFeedWidgetProps {
  widget: Widget;
}

export function ActivityFeedWidget({ widget }: ActivityFeedWidgetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Mock data for demonstration purposes
  useEffect(() => {
    if (isLoading) {
      fetchActivities();
    }
    
    // Set up a polling interval for real-time updates
    const intervalId = setInterval(() => {
      fetchLatestActivities();
    }, 30000); // Poll every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [isLoading]);

  // Load more data when scrolling to the bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          loadMoreActivities();
        }
      },
      { threshold: 1.0 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMore, isLoadingMore, activities]);

  // Filter activities when activeFilter changes
  useEffect(() => {
    if (!isLoading && activeFilter) {
      setActivities(prev => 
        prev.filter(activity => activeFilter === 'ALL' || activity.type === activeFilter)
      );
    }
  }, [activeFilter, isLoading]);

  const fetchActivities = async () => {
    try {
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/dashboard/activities?page=${page}&filter=${activeFilter || ''}`);
      // const data = await response.json();
      
      // Mock data for demonstration
      const mockData: ActivityItem[] = [
        {
          id: '1',
          type: 'CHECKOUT',
          timestamp: new Date(Date.now() - 25 * 60000).toISOString(), // 25 minutes ago
          title: 'Book Checkout',
          description: 'The Great Gatsby was checked out by John Smith',
          user: 'Librarian Alice',
          userId: 'user1',
          bookId: 'book1',
          memberId: 'member1'
        },
        {
          id: '2',
          type: 'RETURN',
          timestamp: new Date(Date.now() - 60 * 60000).toISOString(), // 1 hour ago
          title: 'Book Return',
          description: 'To Kill a Mockingbird was returned by Sarah Johnson',
          user: 'Librarian Bob',
          userId: 'user2',
          bookId: 'book2',
          memberId: 'member2'
        },
        {
          id: '3',
          type: 'OVERDUE',
          timestamp: new Date(Date.now() - 120 * 60000).toISOString(), // 2 hours ago
          title: 'Overdue Notice',
          description: '1984 is 3 days overdue from Michael Brown',
          bookId: 'book3',
          memberId: 'member3'
        },
        {
          id: '4',
          type: 'MEMBER_SIGNUP',
          timestamp: new Date(Date.now() - 180 * 60000).toISOString(), // 3 hours ago
          title: 'New Member',
          description: 'Emily Davis joined the library',
          user: 'Admin Charlie',
          userId: 'user3',
          memberId: 'member4'
        },
        {
          id: '5',
          type: 'BOOK_ADDED',
          timestamp: new Date(Date.now() - 240 * 60000).toISOString(), // 4 hours ago
          title: 'New Book Added',
          description: 'The Catcher in the Rye was added to the collection',
          user: 'Librarian Alice',
          userId: 'user1',
          bookId: 'book4'
        }
      ];
      
      setActivities(activeFilter ? mockData.filter(activity => 
        activeFilter === 'ALL' || activity.type === activeFilter
      ) : mockData);
      setHasMore(page < 3); // For demo, limit to 3 pages
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setIsLoading(false);
    }
  };

  const fetchLatestActivities = async () => {
    try {
      // In a real implementation, this would be an API call with a timestamp filter
      // const response = await fetch(`/api/dashboard/activities/latest?since=${activities[0]?.timestamp || ''}`);
      // const data = await response.json();
      
      // Mock data for demonstration - 50% chance of new activity
      if (Math.random() > 0.5) {
        const newActivityTypes: ActivityItem['type'][] = ['CHECKOUT', 'RETURN', 'OVERDUE', 'MEMBER_SIGNUP', 'BOOK_ADDED'];
        const randomType = newActivityTypes[Math.floor(Math.random() * newActivityTypes.length)];
        const titles: Record<ActivityItem['type'], string> = {
          'CHECKOUT': 'Book Checkout',
          'RETURN': 'Book Return',
          'OVERDUE': 'Overdue Notice',
          'MEMBER_SIGNUP': 'New Member',
          'BOOK_ADDED': 'New Book Added'
        };
        
        const descriptions: Record<ActivityItem['type'], string> = {
          'CHECKOUT': 'A new book was checked out',
          'RETURN': 'A book was returned',
          'OVERDUE': 'A book is now overdue',
          'MEMBER_SIGNUP': 'A new member signed up',
          'BOOK_ADDED': 'A new book was added to the collection'
        };
        
        const newActivity: ActivityItem = {
          id: `new_${Date.now()}`,
          type: randomType,
          timestamp: new Date().toISOString(),
          title: titles[randomType],
          description: descriptions[randomType],
          user: 'System'
        };
        
        if (!activeFilter || activeFilter === 'ALL' || activeFilter === randomType) {
          setActivities(prev => [newActivity, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error fetching latest activities:', error);
    }
  };

  const loadMoreActivities = async () => {
    if (!hasMore || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/dashboard/activities?page=${page + 1}&filter=${activeFilter || ''}`);
      // const data = await response.json();
      
      // Mock data for demonstration
      const nextPage = page + 1;
      const mockOlderData: ActivityItem[] = [
        {
          id: `${nextPage}_1`,
          type: 'CHECKOUT',
          timestamp: new Date(Date.now() - (300 + nextPage * 60) * 60000).toISOString(), 
          title: 'Book Checkout',
          description: 'The Lord of the Rings was checked out by Alex Wilson',
          user: 'Librarian David',
          userId: 'user4',
          bookId: 'book5',
          memberId: 'member5'
        },
        {
          id: `${nextPage}_2`,
          type: 'MEMBER_SIGNUP',
          timestamp: new Date(Date.now() - (320 + nextPage * 60) * 60000).toISOString(),
          title: 'New Member',
          description: 'Robert Johnson joined the library',
          user: 'Admin Eva',
          userId: 'user5',
          memberId: 'member6'
        },
        {
          id: `${nextPage}_3`,
          type: 'BOOK_ADDED',
          timestamp: new Date(Date.now() - (340 + nextPage * 60) * 60000).toISOString(),
          title: 'New Book Added',
          description: 'Harry Potter was added to the collection',
          user: 'Librarian Frank',
          userId: 'user6',
          bookId: 'book6'
        }
      ];
      
      const filteredData = activeFilter && activeFilter !== 'ALL' 
        ? mockOlderData.filter(activity => activity.type === activeFilter)
        : mockOlderData;
      
      setActivities(prev => [...prev, ...filteredData]);
      setPage(nextPage);
      setHasMore(nextPage < 3); // For demo, limit to 3 pages
    } catch (error) {
      console.error('Error loading more activities:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleFilterChange = (filter: string | null) => {
    setActiveFilter(filter);
    setIsLoading(true);
    setPage(1);
    setHasMore(true);
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'CHECKOUT':
      case 'RETURN':
      case 'OVERDUE':
        return <BookOpen className="h-4 w-4" />;
      case 'MEMBER_SIGNUP':
        return <User className="h-4 w-4" />;
      case 'BOOK_ADDED':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityBadge = (type: ActivityItem['type']) => {
    switch (type) {
      case 'CHECKOUT':
        return <Badge className="bg-blue-500">Checkout</Badge>;
      case 'RETURN':
        return <Badge className="bg-green-500">Return</Badge>;
      case 'OVERDUE':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'MEMBER_SIGNUP':
        return <Badge className="bg-purple-500">New Member</Badge>;
      case 'BOOK_ADDED':
        return <Badge className="bg-amber-500">New Book</Badge>;
      default:
        return <Badge>Activity</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-indigo-600">
          <Activity className="h-5 w-5 mr-2" />
          <span className="font-medium">Activity Feed</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={fetchLatestActivities}
          >
            <RotateCw className="h-4 w-4" />
            <span className="sr-only">Refresh</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="h-4 w-4 mr-2" />
                {activeFilter ? activeFilter.replace('_', ' ') : 'All'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleFilterChange('ALL')}>
                All Activities
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('CHECKOUT')}>
                Checkouts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('RETURN')}>
                Returns
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('OVERDUE')}>
                Overdue
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('MEMBER_SIGNUP')}>
                New Members
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('BOOK_ADDED')}>
                New Books
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[260px]">
          <div className="animate-spin h-6 w-6 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
        </div>
      ) : activities.length > 0 ? (
        
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex space-x-3">
                <div className={`
                  flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center
                  ${activity.type === 'CHECKOUT' ? 'bg-blue-100 text-blue-600' : ''}
                  ${activity.type === 'RETURN' ? 'bg-green-100 text-green-600' : ''}
                  ${activity.type === 'OVERDUE' ? 'bg-red-100 text-red-600' : ''}
                  ${activity.type === 'MEMBER_SIGNUP' ? 'bg-purple-100 text-purple-600' : ''}
                  ${activity.type === 'BOOK_ADDED' ? 'bg-amber-100 text-amber-600' : ''}
                `}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">{activity.title}</h4>
                    {getActivityBadge(activity.type)}
                  </div>
                  <p className="text-xs text-gray-600">{activity.description}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <span>{activity.user && `${activity.user} · `}</span>
                    <span>{formatTimestamp(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {hasMore && (
              <div ref={loadMoreRef} className="flex justify-center py-2">
                {isLoadingMore ? (
                  <div className="animate-spin h-4 w-4 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
                ) : (
                  <span className="text-xs text-gray-500">Scroll for more</span>
                )}
              </div>
            )}
          </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[260px] border border-dashed rounded-md">
          <Activity className="h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No activities found</p>
        </div>
      )}
    </div>
  );
}
