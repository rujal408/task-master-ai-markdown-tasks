'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookStatus, TransactionStatus } from '@prisma/client';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { AlertTriangle, Wrench, Trash2, BookX } from 'lucide-react';

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

interface MaintenanceSummaryProps {
  data: any;
}

// Colors for status charts
const statusColors = {
  LOST: 'rgba(239, 68, 68, 0.6)',
  DAMAGED: 'rgba(249, 115, 22, 0.6)',
  UNDER_MAINTENANCE: 'rgba(168, 85, 247, 0.6)',
  DISCARDED: 'rgba(107, 114, 128, 0.6)',
};

// Icons for status
const statusIcons = {
  LOST: <BookX className="h-5 w-5 text-red-500" />,
  DAMAGED: <AlertTriangle className="h-5 w-5 text-orange-500" />,
  UNDER_MAINTENANCE: <Wrench className="h-5 w-5 text-purple-500" />,
  DISCARDED: <Trash2 className="h-5 w-5 text-gray-500" />,
};

export default function MaintenanceSummary({ data }: MaintenanceSummaryProps) {
  if (!data) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No maintenance data available. Please adjust your filters or try again.</p>
      </div>
    );
  }

  // Format data for status chart
  const statusChartData = {
    labels: data.statusCounts.map((item: any) => item.status),
    datasets: [
      {
        label: 'Books by Status',
        data: data.statusCounts.map((item: any) => item.count),
        backgroundColor: data.statusCounts.map((item: any) => statusColors[item.status as keyof typeof statusColors] || 'rgba(107, 114, 128, 0.6)'),
        borderColor: data.statusCounts.map((item: any) => statusColors[item.status as keyof typeof statusColors]?.replace('0.6', '1') || 'rgba(107, 114, 128, 1)'),
        borderWidth: 1,
      },
    ],
  };

  // Format data for category chart
  const categoryChartData = {
    labels: data.categoryBreakdown.map((item: any) => item.category),
    datasets: [
      {
        label: 'Maintenance Books by Category',
        data: data.categoryBreakdown.map((item: any) => item.total),
        backgroundColor: 'rgba(249, 115, 22, 0.6)',
        borderColor: 'rgba(249, 115, 22, 1)',
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
        <h2 className="text-xl font-semibold mb-2">Maintenance Report</h2>
        <div className="text-sm text-gray-500">
          <p>Generated: {formattedDate}</p>
          <p>Timeframe: {data.timeframe === 'all' ? 'All Time' : `Last ${data.timeframe}`}</p>
        </div>
      </div>

      {/* Summary statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {data.statusCounts.map((status: any) => (
          <Card key={status.status}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                {statusIcons[status.status as keyof typeof statusIcons] || <AlertTriangle className="h-5 w-5 mr-2" />}
                <span className="ml-2">
                  {status.status.replace('_', ' ')}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.count}</div>
              <div className="text-xs text-gray-500 mt-1">
                {((status.count / data.totalMaintenanceBooks) * 100).toFixed(1)}% of maintenance books
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Books by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Pie data={statusChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Books by Category</CardTitle>
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

      {/* Category breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Lost</th>
                  <th className="px-4 py-3">Damaged</th>
                  <th className="px-4 py-3">Under Maintenance</th>
                  <th className="px-4 py-3">Discarded</th>
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.categoryBreakdown.map((category: any, index: number) => {
                  // Find counts for each status
                  const lostCount = category.statuses.find((s: any) => s.status === BookStatus.LOST)?.count || 0;
                  const damagedCount = category.statuses.find((s: any) => s.status === BookStatus.DAMAGED)?.count || 0;
                  const maintenanceCount = category.statuses.find((s: any) => s.status === BookStatus.UNDER_MAINTENANCE)?.count || 0;
                  const discardedCount = category.statuses.find((s: any) => s.status === BookStatus.DISCARDED)?.count || 0;
                  
                  return (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-3 font-medium">{category.category}</td>
                      <td className="px-4 py-3">{lostCount}</td>
                      <td className="px-4 py-3">{damagedCount}</td>
                      <td className="px-4 py-3">{maintenanceCount}</td>
                      <td className="px-4 py-3">{discardedCount}</td>
                      <td className="px-4 py-3 font-semibold">{category.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed book list */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Book Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last Updated</th>
                  <th className="px-4 py-3">Transaction</th>
                  <th className="px-4 py-3">User</th>
                </tr>
              </thead>
              <tbody>
                {data.books.map((book: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-3 font-medium">{book.title}</td>
                    <td className="px-4 py-3">{book.author}</td>
                    <td className="px-4 py-3">{book.category}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${book.status === BookStatus.LOST ? 'bg-red-100 text-red-800' : ''}
                        ${book.status === BookStatus.DAMAGED ? 'bg-orange-100 text-orange-800' : ''}
                        ${book.status === BookStatus.UNDER_MAINTENANCE ? 'bg-purple-100 text-purple-800' : ''}
                        ${book.status === BookStatus.DISCARDED ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                        {book.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{new Date(book.updatedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {book.lastTransaction ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${book.lastTransaction.status === TransactionStatus.LOST ? 'bg-red-100 text-red-800' : ''}
                          ${book.lastTransaction.status === TransactionStatus.DAMAGED ? 'bg-orange-100 text-orange-800' : ''}
                          ${book.lastTransaction.status === TransactionStatus.CLAIMED_RETURNED ? 'bg-yellow-100 text-yellow-800' : ''}
                        `}>
                          {book.lastTransaction.status}
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      {book.lastTransaction ? book.lastTransaction.userName : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
