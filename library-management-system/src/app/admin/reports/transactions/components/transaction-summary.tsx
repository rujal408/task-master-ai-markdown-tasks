'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionStatus } from '@prisma/client';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { BookOpen, UserCheck, Clock, BarChart2 } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  PointElement,
  LineElement
);

interface TransactionSummaryProps {
  data: any;
}

// Status colors for consistent styling
const statusColors = {
  CHECKED_OUT: 'rgba(59, 130, 246, 0.7)',
  RETURNED: 'rgba(16, 185, 129, 0.7)',
  OVERDUE: 'rgba(245, 158, 11, 0.7)',
  LOST: 'rgba(239, 68, 68, 0.7)',
  DAMAGED: 'rgba(168, 85, 247, 0.7)',
  CLAIMED_RETURNED: 'rgba(107, 114, 128, 0.7)',
};

const statusBorderColors = {
  CHECKED_OUT: 'rgba(59, 130, 246, 1)',
  RETURNED: 'rgba(16, 185, 129, 1)',
  OVERDUE: 'rgba(245, 158, 11, 1)',
  LOST: 'rgba(239, 68, 68, 1)',
  DAMAGED: 'rgba(168, 85, 247, 1)',
  CLAIMED_RETURNED: 'rgba(107, 114, 128, 1)',
};

export default function TransactionSummary({ data }: TransactionSummaryProps) {
  if (!data) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No transaction data available. Please adjust your filters or try again.</p>
      </div>
    );
  }

  // Format date for display
  const formattedDate = new Date(data.generatedAt).toLocaleString();
  
  // Format data for status chart
  const statusChartData = {
    labels: data.statusCounts.map((item: any) => formatStatusLabel(item.status)),
    datasets: [
      {
        label: 'Transactions by Status',
        data: data.statusCounts.map((item: any) => item.count),
        backgroundColor: data.statusCounts.map((item: any) => 
          statusColors[item.status as keyof typeof statusColors] || 'rgba(107, 114, 128, 0.7)'
        ),
        borderColor: data.statusCounts.map((item: any) => 
          statusBorderColors[item.status as keyof typeof statusBorderColors] || 'rgba(107, 114, 128, 1)'
        ),
        borderWidth: 1,
      },
    ],
  };
  
  // Format data for category chart
  const categoryChartData = {
    labels: data.categoryBreakdown.map((item: any) => item.category),
    datasets: [
      {
        label: 'Transactions by Category',
        data: data.categoryBreakdown.map((item: any) => item.transactionCount),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Format data for monthly trends chart
  const monthlyTrendData = {
    labels: data.monthlyTrend.map((item: any) => item.month),
    datasets: [
      {
        label: 'Checkouts',
        data: data.monthlyTrend.map((item: any) => item.checkouts),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Returns',
        data: data.monthlyTrend.map((item: any) => item.returns),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Overdue',
        data: data.monthlyTrend.map((item: any) => item.overdue),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.5)',
        tension: 0.3,
      }
    ],
  };

  // Helper function to format status labels
  function formatStatusLabel(status: string): string {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-2">Transaction Report Summary</h2>
        <div className="text-sm text-gray-500">
          <p>Generated: {formattedDate}</p>
          <p>Timeframe: {data.timeframe === 'all' ? 'All Time' : `Last ${data.timeframe}`}</p>
          {data.dateRange.from && data.dateRange.to && (
            <p>Date Range: {new Date(data.dateRange.from).toLocaleDateString()} to {new Date(data.dateRange.to).toLocaleDateString()}</p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalTransactions}</div>
            <p className="text-xs text-gray-500 mt-1">
              All transactions in selected timeframe
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeMembers.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              Members with transactions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Checkout Duration</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageCheckoutDays} days</div>
            <p className="text-xs text-gray-500 mt-1">
              For completed transactions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
            <BarChart2 className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overdueTransactions.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              Currently overdue transactions
            </p>
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
              <Pie data={statusChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                },
              }} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Transactions by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar data={categoryChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y' as const,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Transaction Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Line data={monthlyTrendData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Number of Transactions',
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: 'Month',
                  }
                }
              }
            }} />
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Count</th>
                  <th className="px-4 py-3">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {data.statusCounts.map((status: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${status.status === TransactionStatus.CHECKED_OUT ? 'bg-blue-100 text-blue-800' : ''}
                        ${status.status === TransactionStatus.RETURNED ? 'bg-green-100 text-green-800' : ''}
                        ${status.status === TransactionStatus.OVERDUE ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${status.status === TransactionStatus.LOST ? 'bg-red-100 text-red-800' : ''}
                        ${status.status === TransactionStatus.DAMAGED ? 'bg-purple-100 text-purple-800' : ''}
                        ${status.status === TransactionStatus.CLAIMED_RETURNED ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                        {formatStatusLabel(status.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{status.count}</td>
                    <td className="px-4 py-3">
                      {((status.count / data.totalTransactions) * 100).toFixed(1)}%
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
