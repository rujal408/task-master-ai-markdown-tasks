'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionStatus } from '@prisma/client';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { BookOpen, ClockIcon, AlertCircle } from 'lucide-react';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Common chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
    },
  },
};

interface CirculationSummaryProps {
  data: any;
}

// Colors for status charts
const statusColors = {
  CHECKED_OUT: 'rgba(59, 130, 246, 0.6)',
  RETURNED: 'rgba(34, 197, 94, 0.6)',
  OVERDUE: 'rgba(239, 68, 68, 0.6)',
  LOST: 'rgba(249, 115, 22, 0.6)',
  DAMAGED: 'rgba(168, 85, 247, 0.6)',
  CLAIMED_RETURNED: 'rgba(107, 114, 128, 0.6)',
};

export default function CirculationSummary({ data }: CirculationSummaryProps) {
  if (!data) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No circulation data available. Please adjust your filters or try again.</p>
      </div>
    );
  }

  // Format data for status chart
  const statusChartData = {
    labels: data.transactionsByStatus.map((item: any) => item.status),
    datasets: [
      {
        label: 'Transactions by Status',
        data: data.transactionsByStatus.map((item: any) => item.count),
        backgroundColor: data.transactionsByStatus.map((item: any) => statusColors[item.status as keyof typeof statusColors] || 'rgba(107, 114, 128, 0.6)'),
        borderColor: data.transactionsByStatus.map((item: any) => statusColors[item.status as keyof typeof statusColors]?.replace('0.6', '1') || 'rgba(107, 114, 128, 1)'),
        borderWidth: 1,
      },
    ],
  };

  // Format data for category chart
  const categoryChartData = {
    labels: data.categoryBreakdown.slice(0, 10).map((item: any) => item.category),
    datasets: [
      {
        label: 'Transactions by Category',
        data: data.categoryBreakdown.slice(0, 10).map((item: any) => item.count),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Format date for display
  const formattedDate = new Date(data.generatedAt).toLocaleString();

  return (
    <div className="space-y-6">
      {/* Report header */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-2">Circulation Report</h2>
        <div className="text-sm text-gray-500">
          <p>Generated: {formattedDate}</p>
          <p>Timeframe: {data.timeframe === 'all' ? 'All Time' : `Last ${data.timeframe}`}</p>
        </div>
      </div>

      {/* Summary statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{data.totalTransactions}</div>
              <BookOpen className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{data.overdueTransactions}</div>
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Checkout Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{data.averageCheckoutDuration} days</div>
              <ClockIcon className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Transactions by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Pie data={statusChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Categories by Circulation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar 
                data={categoryChartData} 
                options={{
                  ...chartOptions,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  indexAxis: 'y' as const,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most checked out books */}
      <Card>
        <CardHeader>
          <CardTitle>Most Checked Out Books</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">ISBN</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Checkouts</th>
                </tr>
              </thead>
              <tbody>
                {data.mostCheckedOutBooks.map((item: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-3 font-medium">{item.book?.title || 'Unknown'}</td>
                    <td className="px-4 py-3">{item.book?.author || 'Unknown'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{item.book?.isbn || 'N/A'}</td>
                    <td className="px-4 py-3">{item.book?.category || 'Unknown'}</td>
                    <td className="px-4 py-3 font-semibold">{item.checkoutCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Category breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle>Circulation by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Number of Checkouts</th>
                  <th className="px-4 py-3">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {data.categoryBreakdown.map((category: any, index: number) => {
                  const percentage = ((category.count / data.totalTransactions) * 100).toFixed(1);
                  
                  return (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-3 font-medium">{category.category}</td>
                      <td className="px-4 py-3">{category.count}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span className="mr-2">{percentage}%</span>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
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
