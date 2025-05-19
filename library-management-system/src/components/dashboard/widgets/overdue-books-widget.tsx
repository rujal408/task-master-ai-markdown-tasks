'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, PhoneCall, Mail, Clock } from 'lucide-react';
import { Widget } from '../dashboard-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OverdueBook {
  id: string;
  title: string;
  memberName: string;
  memberId: string;
  dueDate: string;
  daysOverdue: number;
  memberEmail?: string;
  memberPhone?: string;
}

interface OverdueBooksWidgetProps {
  widget: Widget;
}

export function OverdueBooksWidget({ widget }: OverdueBooksWidgetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [overdueBooks, setOverdueBooks] = useState<OverdueBook[]>([]);

  // Mock data for demonstration purposes
  useEffect(() => {
    if (isLoading) {
      const fetchData = async () => {
        try {
          // In a real implementation, this would be an API call
          // const response = await fetch('/api/dashboard/overdue-books');
          // const data = await response.json();
          
          // Mock data for demonstration
          const mockData: OverdueBook[] = [
            {
              id: '1',
              title: 'The Great Gatsby',
              memberName: 'John Smith',
              memberId: 'MEM001',
              dueDate: '2025-05-10',
              daysOverdue: 6,
              memberEmail: 'john.smith@example.com',
              memberPhone: '555-123-4567'
            },
            {
              id: '2',
              title: 'To Kill a Mockingbird',
              memberName: 'Sarah Johnson',
              memberId: 'MEM042',
              dueDate: '2025-05-12',
              daysOverdue: 4,
              memberEmail: 'sjohnson@example.com'
            },
            {
              id: '3',
              title: '1984',
              memberName: 'Michael Brown',
              memberId: 'MEM078',
              dueDate: '2025-05-14',
              daysOverdue: 2,
              memberPhone: '555-987-6543'
            }
          ];
          
          setOverdueBooks(mockData);
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching overdue books data:', error);
          setIsLoading(false);
        }
      };
      
      fetchData();
      
      // Refresh data every 10 minutes
      const intervalId = setInterval(fetchData, 600000);
      return () => clearInterval(intervalId);
    }
  }, [isLoading]);

  const handleSendEmail = async (memberId: string, bookId: string) => {
    // In a real implementation, this would send an email notification
    console.log(`Sending email notification to member ${memberId} about book ${bookId}`);
    alert(`Email notification sent to member ${memberId}`);
  };

  const handleCallMember = (memberId: string) => {
    // In a real implementation, this might trigger a phone system or log a call
    console.log(`Calling member ${memberId}`);
    const member = overdueBooks.find(book => book.memberId === memberId);
    if (member?.memberPhone) {
      alert(`Calling ${member.memberName} at ${member.memberPhone}`);
    } else {
      alert(`No phone number available for ${member?.memberName}`);
    }
  };

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-amber-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span className="font-medium">{overdueBooks.length} Overdue Books</span>
        </div>
        {overdueBooks.length > 0 && (
          <Button size="sm" variant="outline" asChild>
            <a href="/dashboard/borrowings?filter=overdue">View All</a>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[200px]">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : overdueBooks.length > 0 ? (
        
          <div className="space-y-3">
            {overdueBooks.map((book) => (
              <div 
                key={book.id} 
                className="p-3 rounded-md border bg-amber-50 border-amber-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-sm">{book.title}</h4>
                    <p className="text-xs text-gray-600">{book.memberName}</p>
                  </div>
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                    {book.daysOverdue} {book.daysOverdue === 1 ? 'day' : 'days'} overdue
                  </Badge>
                </div>
                <div className="flex items-center text-xs text-gray-500 mb-3">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Due: {new Date(book.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex space-x-2">
                  {book.memberEmail && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-8"
                      onClick={() => handleSendEmail(book.memberId, book.id)}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Button>
                  )}
                  {book.memberPhone && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-8"
                      onClick={() => handleCallMember(book.memberId)}
                    >
                      <PhoneCall className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        
      ) : (
        <div className="flex flex-col items-center justify-center h-[200px] border border-dashed rounded-md">
          <div className="text-green-500 mb-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.5 12L10.5 15L16.5 9M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-sm text-gray-500">No overdue books</p>
        </div>
      )}
    </div>
  );
}
