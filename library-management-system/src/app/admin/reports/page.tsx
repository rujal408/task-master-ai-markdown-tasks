'use client';

import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle, BookOpen, BarChart3, PieChart, ChevronRight, FileText } from 'lucide-react';

export default function ReportsPage() {
  const { data: session } = useSession();

  // Check if user is authorized
  const isAuthorized = 
    session?.user?.role === UserRole.ADMIN || 
    session?.user?.role === UserRole.LIBRARIAN;

  if (!isAuthorized) {
    return (
      <div className="container mx-auto p-6">
        <div className="p-4 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">Access Denied</h3>
          </div>
          <p>
            You do not have permission to access this page. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Library Reports</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Inventory Report Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Inventory Reports
            </CardTitle>
            <CardDescription>
              Track book status, availability, and collection statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-gray-500 mb-4">
              View comprehensive statistics about your book collection, including status breakdowns,
              category distribution, and acquisition trends.
            </p>
            <ul className="text-sm space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Book status distribution
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Category analysis
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                New acquisitions tracking
              </li>
            </ul>
          </CardContent>
          <div className="px-6 pb-6 mt-auto">
            <Link href="/admin/reports/inventory">
              <Button className="w-full">
                View Inventory Reports
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Circulation Report Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              Circulation Reports
            </CardTitle>
            <CardDescription>
              Analyze checkout patterns and popular books
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-gray-500 mb-4">
              Gain insights into borrowing trends, including most popular books, 
              average checkout durations, and category preferences.
            </p>
            <ul className="text-sm space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Most checked out titles
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Transaction status breakdown
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Average checkout duration
              </li>
            </ul>
          </CardContent>
          <div className="px-6 pb-6 mt-auto">
            <Link href="/admin/reports/inventory?tab=circulation">
              <Button className="w-full" variant="outline">
                View Circulation Reports
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Maintenance Report Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-orange-500" />
              Maintenance Reports
            </CardTitle>
            <CardDescription>
              Track lost, damaged, and books under maintenance
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-gray-500 mb-4">
              Monitor books that need attention, including detailed statistics on lost, 
              damaged, and books undergoing maintenance or repair.
            </p>
            <ul className="text-sm space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                Lost and damaged book tracking
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                Status transition analysis
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                Category vulnerability assessment
              </li>
            </ul>
          </CardContent>
          <div className="px-6 pb-6 mt-auto">
            <Link href="/admin/reports/inventory?tab=maintenance">
              <Button className="w-full" variant="outline">
                View Maintenance Reports
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Export Reports Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              Export Reports
            </CardTitle>
            <CardDescription>
              Download reports in various formats
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-gray-500 mb-4">
              Export any report data in CSV format for further analysis in 
              spreadsheet applications or other data processing tools.
            </p>
            <ul className="text-sm space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                CSV export functionality
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Customizable report parameters
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Time-period filtering options
              </li>
            </ul>
          </CardContent>
          <div className="px-6 pb-6 mt-auto">
            <Link href="/admin/reports/inventory">
              <Button className="w-full" variant="outline">
                Go to Export Options
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Help section */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Using Reports</h2>
        <p className="text-sm text-gray-600 mb-4">
          The reporting system allows you to generate various statistics and analytics about your library&apos;s inventory and circulation.
          Here are some tips for getting the most out of the reports:
        </p>
        <ul className="text-sm text-gray-600 space-y-2 list-disc pl-6">
          <li>Use the timeframe filter to focus on specific periods</li>
          <li>Filter by category to analyze specific sections of your collection</li>
          <li>Export to CSV for further analysis in spreadsheet applications</li>
          <li>Check maintenance reports regularly to identify books needing attention</li>
          <li>Use circulation reports to identify popular books and inform acquisition decisions</li>
        </ul>
      </div>
    </div>
  );
}
