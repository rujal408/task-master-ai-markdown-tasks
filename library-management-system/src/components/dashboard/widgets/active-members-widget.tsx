'use client';

import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Users } from 'lucide-react';
import { Widget } from '../dashboard-layout';

interface ActiveMembersWidgetProps {
  widget: Widget;
}

export function ActiveMembersWidget({ widget }: ActiveMembersWidgetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [activeMembers, setActiveMembers] = useState(0);
  const [percentChange, setPercentChange] = useState(0);
  const [changeDirection, setChangeDirection] = useState<'up' | 'down' | 'none'>('none');

  // Mock data for demonstration purposes
  useEffect(() => {
    if (isLoading) {
      const fetchData = async () => {
        try {
          // In a real implementation, this would be an API call
          // const response = await fetch('/api/dashboard/active-members');
          // const data = await response.json();
          
          // Mock data for demonstration
          const mockData = {
            current: Math.floor(Math.random() * 100) + 150,
            previous: Math.floor(Math.random() * 100) + 120,
          };
          
          const change = mockData.current - mockData.previous;
          const percent = mockData.previous === 0 
            ? 100 
            : Math.round((change / mockData.previous) * 100);
          
          setActiveMembers(mockData.current);
          setPercentChange(Math.abs(percent));
          setChangeDirection(percent > 0 ? 'up' : percent < 0 ? 'down' : 'none');
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching active members data:', error);
          setIsLoading(false);
        }
      };
      
      fetchData();
      
      // Refresh data every 5 minutes
      const intervalId = setInterval(fetchData, 300000);
      return () => clearInterval(intervalId);
    }
  }, [isLoading]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="rounded-full p-2 bg-green-100 text-green-600">
          <Users className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold">
          {isLoading ? "..." : activeMembers}
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
            {percentChange}% from last month
          </span>
        </div>
      </div>
    </div>
  );
}
