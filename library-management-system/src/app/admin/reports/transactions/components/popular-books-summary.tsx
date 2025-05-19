'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { BookOpen, TrendingUp, Award } from 'lucide-react';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface PopularBooksSummaryProps {
  data: any;
}

export default function PopularBooksSummary({ data }: PopularBooksSummaryProps) {
  if (!data || !data.popularBooks || data.popularBooks.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No popular books data available. Please adjust your filters or try again.</p>
      </div>
    );
  }

  // Format date for display
  const formattedDate = new Date(data.generatedAt).toLocaleString();

  // Format data for popular books chart
  const popularBooksChartData = {
    labels: data.popularBooks.map((book: any) => book.title.length > 20 ? book.title.substring(0, 20) + '...' : book.title),
    datasets: [
      {
        label: 'Checkout Count',
        data: data.popularBooks.map((book: any) => book.checkoutCount),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Format data for category popularity chart
  const categoryMap = new Map();
  data.popularBooks.forEach((book: any) => {
    const currentCount = categoryMap.get(book.category) || 0;
    categoryMap.set(book.category, currentCount + book.checkoutCount);
  });

  const categoryPopularityData = {
    labels: Array.from(categoryMap.keys()),
    datasets: [
      {
        label: 'Total Checkouts',
        data: Array.from(categoryMap.values()),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-2">Popular Books Report</h2>
        <div className="text-sm text-gray-500">
          <p>Generated: {formattedDate}</p>
          <p>Timeframe: {data.timeframe === 'all' ? 'All Time' : `Last ${data.timeframe}`}</p>
          {data.dateRange.from && data.dateRange.to && (
            <p>Date Range: {new Date(data.dateRange.from).toLocaleDateString()} to {new Date(data.dateRange.to).toLocaleDateString()}</p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Books Circulated</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.popularBooks.reduce((sum: number, book: any) => sum + book.checkoutCount, 0)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Most Popular Book</CardTitle>
            <Award className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">{data.popularBooks[0]?.title || 'N/A'}</div>
            <p className="text-xs text-gray-500 mt-1">{data.popularBooks[0]?.checkoutCount || 0} checkouts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Popular Category</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[1] || 0} checkouts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Most Popular Books</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar data={popularBooksChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y' as const,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      title: (items) => {
                        const index = items[0].dataIndex;
                        return data.popularBooks[index].title;
                      },
                    }
                  }
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Number of Checkouts'
                    }
                  }
                }
              }} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Category Popularity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar data={categoryPopularityData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    title: {
                      display: true,
                      text: 'Total Checkouts'
                    }
                  }
                }
              }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Books Table */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Books Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Checkout Count</th>
                  <th className="px-4 py-3">Popularity Score</th>
                </tr>
              </thead>
              <tbody>
                {data.popularBooks.map((book: any, index: number) => {
                  // Calculate popularity score as percentage of total checkouts
                  const totalCheckouts = data.popularBooks.reduce((sum: number, b: any) => sum + b.checkoutCount, 0);
                  const popularityScore = totalCheckouts > 0 ? (book.checkoutCount / totalCheckouts) * 100 : 0;
                  
                  return (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-3 font-medium">{index + 1}</td>
                      <td className="px-4 py-3 font-medium">{book.title}</td>
                      <td className="px-4 py-3">{book.author}</td>
                      <td className="px-4 py-3">{book.category}</td>
                      <td className="px-4 py-3">{book.checkoutCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${popularityScore}%` }}
                            ></div>
                          </div>
                          <span className="ml-2">{popularityScore.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
