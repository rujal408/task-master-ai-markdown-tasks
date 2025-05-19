'use client';

import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, BookOpen } from 'lucide-react';
import { Widget } from '../dashboard-layout';

interface BooksCheckedOutWidgetProps {
  widget: Widget;
}

export function BooksCheckedOutWidget({ widget }: BooksCheckedOutWidgetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [checkedOutToday, setCheckedOutToday] = useState(0);
  const [percentChange, setPercentChange] = useState(0);
  const [changeDirection, setChangeDirection] = useState<'up' | 'down' | 'none'>('none');

  // Mock data for demonstration purposes
  useEffect(() => {
    if (isLoading) {
      const fetchData = async () => {
        try {
          // In a real implementation, this would be an API call
          // const response = await fetch('/api/dashboard/books-checked-out');
          // const data = await response.json();
          
          // Mock data for demonstration
          const mockData = {
            today: Math.floor(Math.random() * 20),
            yesterday: Math.floor(Math.random() * 15),
          };
          
          const change = mockData.today - mockData.yesterday;
          const percent = mockData.yesterday === 0 
            ? 100 
            : Math.round((change / mockData.yesterday) * 100);
          
          setCheckedOutToday(mockData.today);
          setPercentChange(Math.abs(percent));
          setChangeDirection(percent > 0 ? 'up' : percent < 0 ? 'down' : 'none');
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching checked out books data:', error);
          setIsLoading(false);
        }
      };
      
      fetchData();
      
      // Refresh data every minute
      const intervalId = setInterval(fetchData, 60000);
      return () => clearInterval(intervalId);
    }
  }, [isLoading]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="rounded-full p-2 bg-blue-100 text-blue-600">
          <BookOpen className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold">
          {isLoading ? "..." : checkedOutToday}
        </div>
        <div className="flex items-center text-xs mt-1">
          {changeDirection === 'up' && (
            <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
          )}
          {changeDirection === 'down' && (
            <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
          )}
          <span className={`
            ${changeDirection === 'up' ? 'text-green-500' : ''}
            ${changeDirection === 'down' ? 'text-red-500' : ''}
            ${changeDirection === 'none' ? 'text-gray-500' : ''}
          `}>
            {percentChange}% from yesterday
          </span>
        </div>
      </div>
    </div>
  );
}
