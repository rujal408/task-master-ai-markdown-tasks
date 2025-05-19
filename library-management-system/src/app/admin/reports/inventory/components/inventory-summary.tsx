'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookStatus } from '@prisma/client';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { BookOpen, AlertTriangle, Clock } from 'lucide-react';

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

interface InventorySummaryProps {
  data: any;
}

// Colors for status charts
const statusColors = {
  AVAILABLE: 'rgba(34, 197, 94, 0.6)',
  CHECKED_OUT: 'rgba(59, 130, 246, 0.6)',
  RESERVED: 'rgba(234, 179, 8, 0.6)',
  LOST: 'rgba(239, 68, 68, 0.6)',
  DAMAGED: 'rgba(249, 115, 22, 0.6)',
  UNDER_MAINTENANCE: 'rgba(168, 85, 247, 0.6)',
  DISCARDED: 'rgba(107, 114, 128, 0.6)',
};

export default function InventorySummary({ data }: InventorySummaryProps) {
  if (!data) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No inventory data available. Please adjust your filters or try again.</p>
      </div>
    );
  }

  // Format data for status chart
  const statusChartData = {
    labels: data.booksByStatus.map((item: any) => item.status),
    datasets: [
      {
        label: 'Books by Status',
        data: data.booksByStatus.map((item: any) => item.count),
        backgroundColor: data.booksByStatus.map((item: any) => statusColors[item.status as keyof typeof statusColors] || 'rgba(107, 114, 128, 0.6)'),
        borderColor: data.booksByStatus.map((item: any) => statusColors[item.status as keyof typeof statusColors]?.replace('0.6', '1') || 'rgba(107, 114, 128, 1)'),
        borderWidth: 1,
      },
    ],
  };

  // Format data for category chart
  const categoryChartData = {
    labels: data.booksByCategory.map((item: any) => item.category),
    datasets: [
      {
        label: 'Books by Category',
        data: data.booksByCategory.map((item: any) => item.count),
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
        <h2 className="text-xl font-semibold mb-2">Inventory Report Summary</h2>
        <div className="text-sm text-gray-500">
          <p>Generated: {formattedDate}</p>
          <p>Timeframe: {data.timeframe === 'all' ? 'All Time' : `Last ${data.timeframe}`}</p>
        </div>
      </div>

      {/* Summary statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{data.totalBooks}</div>
              <BookOpen className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New Acquisitions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{data.newAcquisitions}</div>
              <Clock className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lost or Damaged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{data.lostOrDamagedBooks}</div>
              <AlertTriangle className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Books by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Pie data={statusChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Books by Category</CardTitle>
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
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular categories */}
      <Card>
        <CardHeader>
          <CardTitle>Most Popular Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {data.mostPopularCategories.map((category: any, index: number) => (
              <div key={index} className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-semibold text-gray-800">{category.category}</h3>
                <p className="text-3xl font-bold mt-2">{category.count}</p>
                <p className="text-sm text-gray-500 mt-1">books</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category details table */}
      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Available</th>
                  <th className="px-4 py-3">Checked Out</th>
                  <th className="px-4 py-3">Reserved</th>
                  <th className="px-4 py-3">Lost/Damaged</th>
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.categoryDetails.map((category: any, index: number) => {
                  // Count books by status for this category
                  const available = category.statusCounts.find((s: any) => s.status === BookStatus.AVAILABLE)?.count || 0;
                  const checkedOut = category.statusCounts.find((s: any) => s.status === BookStatus.CHECKED_OUT)?.count || 0;
                  const reserved = category.statusCounts.find((s: any) => s.status === BookStatus.RESERVED)?.count || 0;
                  const lost = category.statusCounts.find((s: any) => s.status === BookStatus.LOST)?.count || 0;
                  const damaged = category.statusCounts.find((s: any) => s.status === BookStatus.DAMAGED)?.count || 0;
                  
                  return (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-3 font-medium">{category.category}</td>
                      <td className="px-4 py-3">{available}</td>
                      <td className="px-4 py-3">{checkedOut}</td>
                      <td className="px-4 py-3">{reserved}</td>
                      <td className="px-4 py-3">{lost + damaged}</td>
                      <td className="px-4 py-3 font-semibold">{category.totalBooks}</td>
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
