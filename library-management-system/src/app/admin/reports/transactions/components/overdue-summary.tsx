'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Clock, AlertTriangle, Calendar, User } from 'lucide-react';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface OverdueSummaryProps {
  data: any;
}

export default function OverdueSummary({ data }: OverdueSummaryProps) {
  if (!data || !data.overdueTransactions || data.overdueTransactions.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No overdue transactions available. This is good news - everything is returned on time!</p>
      </div>
    );
  }

  // Format date for display
  const formattedDate = new Date(data.generatedAt).toLocaleString();

  // Group overdue items by days overdue
  const overdueGroups = {
    '1-7 days': 0,
    '8-14 days': 0,
    '15-30 days': 0,
    '31+ days': 0
  };

  // Books by category
  const categoryMap = new Map();

  // Calculate days overdue for each transaction
  data.overdueTransactions.forEach((transaction: any) => {
    const today = new Date();
    const dueDate = new Date(transaction.dueDate);
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Update overdue groups
    if (daysOverdue <= 7) {
      overdueGroups['1-7 days']++;
    } else if (daysOverdue <= 14) {
      overdueGroups['8-14 days']++;
    } else if (daysOverdue <= 30) {
      overdueGroups['15-30 days']++;
    } else {
      overdueGroups['31+ days']++;
    }
    
    // Update category map
    const category = transaction.book.category || 'Uncategorized';
    const currentCount = categoryMap.get(category) || 0;
    categoryMap.set(category, currentCount + 1);
  });

  // Format data for overdue groups chart
  const overdueGroupsChartData = {
    labels: Object.keys(overdueGroups),
    datasets: [
      {
        label: 'Overdue Items',
        data: Object.values(overdueGroups),
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)', // blue - 1-7 days
          'rgba(245, 158, 11, 0.7)', // yellow - 8-14 days
          'rgba(249, 115, 22, 0.7)', // orange - 15-30 days
          'rgba(239, 68, 68, 0.7)', // red - 31+ days
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Format data for category breakdown chart
  const categoryChartData = {
    labels: Array.from(categoryMap.keys()),
    datasets: [
      {
        label: 'Overdue Items by Category',
        data: Array.from(categoryMap.values()),
        backgroundColor: 'rgba(168, 85, 247, 0.7)', // purple
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Calculate fines based on days overdue (assuming $0.25 per day)
  const fineRate = 0.25; // $0.25 per day
  const totalFines = data.overdueTransactions.reduce((sum: number, transaction: any) => {
    const today = new Date();
    const dueDate = new Date(transaction.dueDate);
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return sum + (daysOverdue * fineRate);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-2">Overdue Items Report</h2>
        <div className="text-sm text-gray-500">
          <p>Generated: {formattedDate}</p>
          <p>Total Overdue Items: {data.overdueTransactions.length}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Overdue Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overdueTransactions.length}</div>
            <p className="text-xs text-gray-500 mt-1">Currently overdue</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Days Overdue</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overdueTransactions.length ? (
                data.overdueTransactions.reduce((sum: number, transaction: any) => {
                  const today = new Date();
                  const dueDate = new Date(transaction.dueDate);
                  return sum + Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                }, 0) / data.overdueTransactions.length
              ).toFixed(1) : '0'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Days past due date</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Accrued Fines</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFines.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">At ${fineRate.toFixed(2)} per day</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Members with Overdues</CardTitle>
            <User className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(data.overdueTransactions.map((t: any) => t.user.id)).size}
            </div>
            <p className="text-xs text-gray-500 mt-1">With at least one overdue item</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Overdue Items by Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Pie data={overdueGroupsChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right' as const,
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const label = context.label || '';
                        const value = context.raw as number;
                        const total = data.overdueTransactions.length;
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: ${value} items (${percentage}%)`;
                      }
                    }
                  }
                }
              }} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Overdue Items by Category</CardTitle>
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
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Number of Overdue Items'
                    }
                  }
                }
              }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Overdue Items Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Book Title</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Days Overdue</th>
                  <th className="px-4 py-3">Fine</th>
                </tr>
              </thead>
              <tbody>
                {data.overdueTransactions.sort((a: any, b: any) => {
                  // Sort by days overdue (descending)
                  const aDueDate = new Date(a.dueDate);
                  const bDueDate = new Date(b.dueDate);
                  return aDueDate.getTime() - bDueDate.getTime();
                }).map((transaction: any, index: number) => {
                  const today = new Date();
                  const dueDate = new Date(transaction.dueDate);
                  const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                  const fine = daysOverdue * fineRate;
                  
                  // Determine severity class based on days overdue
                  let severityClass = 'bg-blue-100 text-blue-800';
                  if (daysOverdue > 30) {
                    severityClass = 'bg-red-100 text-red-800';
                  } else if (daysOverdue > 14) {
                    severityClass = 'bg-orange-100 text-orange-800';
                  } else if (daysOverdue > 7) {
                    severityClass = 'bg-yellow-100 text-yellow-800';
                  }
                  
                  return (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-3 font-medium">{transaction.book.title}</td>
                      <td className="px-4 py-3">{transaction.book.author}</td>
                      <td className="px-4 py-3">{transaction.user.name}</td>
                      <td className="px-4 py-3">{new Date(transaction.dueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityClass}`}>
                          {daysOverdue} days
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">${fine.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg p-4 bg-yellow-50 border border-yellow-100">
              <h3 className="font-medium text-yellow-800 mb-2">Follow-Up Actions</h3>
              <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1">
                <li>Send reminder emails to {new Set(data.overdueTransactions.map((t: any) => t.user.id)).size} members with overdue items</li>
                <li>Consider offering a fine amnesty period for severely overdue items</li>
                <li>Check for patterns in frequently overdue book categories</li>
              </ul>
            </div>
            
            {overdueGroups['31+ days'] > 0 && (
              <div className="rounded-lg p-4 bg-red-50 border border-red-100">
                <h3 className="font-medium text-red-800 mb-2">Critical Overdues</h3>
                <p className="text-sm text-red-700">
                  There are {overdueGroups['31+ days']} items that have been overdue for more than 31 days.
                  Consider contacting these members directly by phone.
                </p>
              </div>
            )}
            
            {Array.from(categoryMap.entries()).length > 0 && (
              <div className="rounded-lg p-4 bg-blue-50 border border-blue-100">
                <h3 className="font-medium text-blue-800 mb-2">Category Insights</h3>
                <p className="text-sm text-blue-700 mb-2">
                  The following categories have the highest number of overdue items:
                </p>
                <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
                  {Array.from(categoryMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([category, count], index) => (
                      <li key={index}>
                        {category}: {count} items ({((count / data.overdueTransactions.length) * 100).toFixed(1)}%)
                      </li>
                    ))
                  }
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
