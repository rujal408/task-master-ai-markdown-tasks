'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Users, UserCheck, Clock, Award } from 'lucide-react';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface MemberActivitySummaryProps {
  data: any;
}

export default function MemberActivitySummary({ data }: MemberActivitySummaryProps) {
  if (!data || !data.activeMembers || data.activeMembers.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No member activity data available. Please adjust your filters or try again.</p>
      </div>
    );
  }

  // Format date for display
  const formattedDate = new Date(data.generatedAt).toLocaleString();

  // Format data for active members chart
  const activeMembersChartData = {
    labels: data.activeMembers.map((member: any) => member.name.length > 15 ? member.name.substring(0, 15) + '...' : member.name),
    datasets: [
      {
        label: 'Transaction Count',
        data: data.activeMembers.map((member: any) => member.transactionCount),
        backgroundColor: 'rgba(79, 70, 229, 0.7)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Calculate activity distribution data
  const activeMembers = data.activeMembers.filter((m: any) => m.transactionCount > 0);
  const averageTransactions = activeMembers.reduce((sum: number, member: any) => sum + member.transactionCount, 0) / activeMembers.length || 0;

  // Group members by activity level
  const highActivity = activeMembers.filter((m: any) => m.transactionCount > averageTransactions * 1.5).length;
  const mediumActivity = activeMembers.filter((m: any) => m.transactionCount >= averageTransactions && m.transactionCount <= averageTransactions * 1.5).length;
  const lowActivity = activeMembers.filter((m: any) => m.transactionCount < averageTransactions).length;

  const activityDistributionData = {
    labels: ['High Activity', 'Medium Activity', 'Low Activity'],
    datasets: [
      {
        label: 'Members',
        data: [highActivity, mediumActivity, lowActivity],
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)', // green
          'rgba(245, 158, 11, 0.7)', // yellow
          'rgba(59, 130, 246, 0.7)', // blue
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(59, 130, 246, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-2">Member Activity Report</h2>
        <div className="text-sm text-gray-500">
          <p>Generated: {formattedDate}</p>
          <p>Timeframe: {data.timeframe === 'all' ? 'All Time' : `Last ${data.timeframe}`}</p>
          {data.dateRange.from && data.dateRange.to && (
            <p>Date Range: {new Date(data.dateRange.from).toLocaleDateString()} to {new Date(data.dateRange.to).toLocaleDateString()}</p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeMembers.length}</div>
            <p className="text-xs text-gray-500 mt-1">With transactions in period</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Transactions</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageTransactions.toFixed(1)}</div>
            <p className="text-xs text-gray-500 mt-1">Per member</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Highest Activity</CardTitle>
            <Award className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeMembers[0]?.transactionCount || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Most active member</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Checkout Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageCheckoutDays} days</div>
            <p className="text-xs text-gray-500 mt-1">For completed transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Most Active Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar data={activeMembersChartData} options={{
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
                        return data.activeMembers[index].name;
                      },
                    }
                  }
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Number of Transactions'
                    }
                  }
                }
              }} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Member Activity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Pie data={activityDistributionData} options={{
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
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: ${value} members (${percentage}%)`;
                      }
                    }
                  }
                }
              }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Member Activity Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Member Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Transaction Count</th>
                  <th className="px-4 py-3">Activity Level</th>
                </tr>
              </thead>
              <tbody>
                {data.activeMembers.map((member: any, index: number) => {
                  // Determine activity level
                  let activityLevel = 'Low';
                  let activityClass = 'bg-blue-100 text-blue-800';
                  
                  if (member.transactionCount > averageTransactions * 1.5) {
                    activityLevel = 'High';
                    activityClass = 'bg-green-100 text-green-800';
                  } else if (member.transactionCount >= averageTransactions) {
                    activityLevel = 'Medium';
                    activityClass = 'bg-yellow-100 text-yellow-800';
                  }
                  
                  return (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-3 font-medium">{index + 1}</td>
                      <td className="px-4 py-3 font-medium">{member.name}</td>
                      <td className="px-4 py-3">{member.email}</td>
                      <td className="px-4 py-3">{member.transactionCount}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${activityClass}`}>
                          {activityLevel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Activity Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Level Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Member activity levels are determined by comparing individual transaction counts to the average:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg p-4 bg-green-50 border border-green-100">
              <h3 className="font-medium text-green-800 mb-2">High Activity</h3>
              <p className="text-sm text-green-600">
                {highActivity} members ({((highActivity / activeMembers.length) * 100).toFixed(1)}%)
              </p>
              <p className="text-xs text-green-500 mt-2">
                Members with transaction count greater than {(averageTransactions * 1.5).toFixed(1)}
              </p>
            </div>
            
            <div className="rounded-lg p-4 bg-yellow-50 border border-yellow-100">
              <h3 className="font-medium text-yellow-800 mb-2">Medium Activity</h3>
              <p className="text-sm text-yellow-600">
                {mediumActivity} members ({((mediumActivity / activeMembers.length) * 100).toFixed(1)}%)
              </p>
              <p className="text-xs text-yellow-500 mt-2">
                Members with transaction count between {averageTransactions.toFixed(1)} and {(averageTransactions * 1.5).toFixed(1)}
              </p>
            </div>
            
            <div className="rounded-lg p-4 bg-blue-50 border border-blue-100">
              <h3 className="font-medium text-blue-800 mb-2">Low Activity</h3>
              <p className="text-sm text-blue-600">
                {lowActivity} members ({((lowActivity / activeMembers.length) * 100).toFixed(1)}%)
              </p>
              <p className="text-xs text-blue-500 mt-2">
                Members with transaction count less than {averageTransactions.toFixed(1)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
