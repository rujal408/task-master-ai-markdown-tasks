'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, BookOpen } from 'lucide-react';
import { Widget } from '../dashboard-layout';

interface PopularBook {
  id: string;
  title: string;
  author: string;
  checkoutCount: number;
}

interface PopularBooksWidgetProps {
  widget: Widget;
}

export function PopularBooksWidget({ widget }: PopularBooksWidgetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [popularBooks, setPopularBooks] = useState<PopularBook[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // Mock data for demonstration purposes
  useEffect(() => {
    if (isLoading) {
      const fetchData = async () => {
        try {
          // In a real implementation, this would be an API call
          // const response = await fetch(`/api/dashboard/popular-books?timeRange=${timeRange}`);
          // const data = await response.json();
          
          // Mock data for demonstration
          const mockData: PopularBook[] = [
            {
              id: '1',
              title: 'The Great Gatsby',
              author: 'F. Scott Fitzgerald',
              checkoutCount: 24
            },
            {
              id: '2',
              title: 'To Kill a Mockingbird',
              author: 'Harper Lee',
              checkoutCount: 19
            },
            {
              id: '3',
              title: '1984',
              author: 'George Orwell',
              checkoutCount: 17
            },
            {
              id: '4',
              title: 'The Hobbit',
              author: 'J.R.R. Tolkien',
              checkoutCount: 15
            },
            {
              id: '5',
              title: 'Pride and Prejudice',
              author: 'Jane Austen',
              checkoutCount: 12
            }
          ];
          
          setPopularBooks(mockData);
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching popular books data:', error);
          setIsLoading(false);
        }
      };
      
      fetchData();
      
      // Refresh data every 5 minutes
      const intervalId = setInterval(fetchData, 300000);
      return () => clearInterval(intervalId);
    }
  }, [isLoading, timeRange]);

  // Find the maximum checkout count for scaling the bars
  const maxCheckoutCount = popularBooks.length > 0
    ? Math.max(...popularBooks.map(book => book.checkoutCount))
    : 0;

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-blue-600">
          <TrendingUp className="h-5 w-5 mr-2" />
          <span className="font-medium">Most Popular Books</span>
        </div>
        <div className="flex text-xs bg-gray-100 rounded-md">
          <button 
            className={`px-2 py-1 rounded-l-md ${timeRange === 'week' ? 'bg-blue-500 text-white' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            Week
          </button>
          <button 
            className={`px-2 py-1 ${timeRange === 'month' ? 'bg-blue-500 text-white' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            Month
          </button>
          <button 
            className={`px-2 py-1 rounded-r-md ${timeRange === 'year' ? 'bg-blue-500 text-white' : ''}`}
            onClick={() => setTimeRange('year')}
          >
            Year
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[200px]">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : popularBooks.length > 0 ? (
        <div className="space-y-4">
          {popularBooks.map((book) => (
            <div key={book.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="truncate max-w-[70%]" title={`${book.title} by ${book.author}`}>
                  {book.title}
                </div>
                <div className="font-medium">{book.checkoutCount}</div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${(book.checkoutCount / maxCheckoutCount) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[200px] border border-dashed rounded-md">
          <BookOpen className="h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      )}
    </div>
  );
}
