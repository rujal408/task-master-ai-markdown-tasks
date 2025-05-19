'use client';

import { useSession } from 'next-auth/react';
import { UserRole, TransactionStatus } from '@prisma/client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { CalendarIcon, Download, Loader2 } from 'lucide-react';
import TransactionSummary from './components/transaction-summary';
import PopularBooksSummary from './components/popular-books-summary';
import MemberActivitySummary from './components/member-activity-summary';
import OverdueSummary from './components/overdue-summary';


// Define the report types
const REPORT_TYPES = {
  SUMMARY: 'summary',
  POPULAR_BOOKS: 'popular-books',
  MEMBER_ACTIVITY: 'member-activity',
  OVERDUE: 'overdue',
};

// Define the timeframe options
const timeframeOptions = [
  { label: 'Last 7 Days', value: 'week' },
  { label: 'Last 30 Days', value: 'month' },
  { label: 'Last 90 Days', value: 'quarter' },
  { label: 'Last 12 Months', value: 'year' },
  { label: 'All Time', value: 'all' },
  { label: 'Custom Range', value: 'custom' },
];

export default function TransactionReportsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState(REPORT_TYPES.SUMMARY);
  const [timeframe, setTimeframe] = useState('month');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<any>(null);

  // Fetch report data from API
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError('');

      let url = '/api/reports/transactions?timeframe=' + timeframe;

      if (status) {
        url += `&status=${status}`;
      }

      if (category) {
        url += `&category=${category}`;
      }

      if (isCustomDate && dateFrom && dateTo) {
        url += `&dateFrom=${dateFrom.toISOString()}&dateTo=${dateTo.toISOString()}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await response.json();
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching report data');
    } finally {
      setLoading(false);
    }
  };

  // Handle timeframe change
  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
    if (value === 'custom') {
      setIsCustomDate(true);
    } else {
      setIsCustomDate(false);
    }
  };

  // Export report as CSV
  const handleExport = () => {
    let url = `/api/reports/transactions?format=csv&timeframe=${timeframe}`;
    
    if (status) {
      url += `&status=${status}`;
    }
    
    if (category) {
      url += `&category=${category}`;
    }
    
    if (isCustomDate && dateFrom && dateTo) {
      url += `&dateFrom=${dateFrom.toISOString()}&dateTo=${dateTo.toISOString()}`;
    }
    
    window.location.href = url;
  };

  // Generate report when params change
  useEffect(() => {
    if (!isCustomDate || (isCustomDate && dateFrom && dateTo)) {
      fetchReportData();
    }
  }, [timeframe, status, category, isCustomDate]);

  // Fetch report when date range changes
  useEffect(() => {
    if (isCustomDate && dateFrom && dateTo) {
      fetchReportData();
    }
  }, [dateFrom, dateTo]);

  // Check if user is authorized
  const isAuthorized = 
    session?.user?.role === UserRole.ADMIN || 
    session?.user?.role === UserRole.LIBRARIAN;

  if (!isAuthorized) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center p-4 mb-4 text-sm text-yellow-800 border border-yellow-300 rounded-lg bg-yellow-50">
          <svg className="flex-shrink-0 inline w-4 h-4 mr-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
          </svg>
          <span className="sr-only">Info</span>
          <div>
            <span className="font-medium">Access Denied!</span> You don&apos;t have permission to access this page.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Transaction Reports</h1>
          <p className="text-gray-500">Generate and view transaction statistics and patterns</p>
        </div>
        <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Timeframe Select */}
            <div className="space-y-2">
              <Label htmlFor="timeframe">Time Period</Label>
              <Select value={timeframe} onValueChange={handleTimeframeChange}>
                <SelectTrigger id="timeframe">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  {timeframeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Select */}
            <div className="space-y-2">
              <Label htmlFor="status">Transaction Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value={TransactionStatus.CHECKED_OUT}>Checked Out</SelectItem>
                  <SelectItem value={TransactionStatus.RETURNED}>Returned</SelectItem>
                  <SelectItem value={TransactionStatus.OVERDUE}>Overdue</SelectItem>
                  <SelectItem value={TransactionStatus.LOST}>Lost</SelectItem>
                  <SelectItem value={TransactionStatus.DAMAGED}>Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Input */}
            <div className="space-y-2">
              <Label htmlFor="category">Book Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Filter by category"
              />
            </div>

            {/* Custom Date Range */}
            {isCustomDate && (
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label>Custom Date Range</Label>
                <div className="flex space-x-2">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="from">From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="to">To</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-4 mb-4">
          <TabsTrigger value={REPORT_TYPES.SUMMARY}>Summary</TabsTrigger>
          <TabsTrigger value={REPORT_TYPES.POPULAR_BOOKS}>Popular Books</TabsTrigger>
          <TabsTrigger value={REPORT_TYPES.MEMBER_ACTIVITY}>Member Activity</TabsTrigger>
          <TabsTrigger value={REPORT_TYPES.OVERDUE}>Overdue Analysis</TabsTrigger>
        </TabsList>

        {/* Loading and Error States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-gray-500">Loading report data...</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Report</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Report Content Areas */}
        {!loading && !error && reportData && (
          <>
            <TabsContent value={REPORT_TYPES.SUMMARY} className="mt-0">
              <TransactionSummary data={reportData} />
            </TabsContent>
            
            <TabsContent value={REPORT_TYPES.POPULAR_BOOKS} className="mt-0">
              <PopularBooksSummary data={reportData} />
            </TabsContent>
            
            <TabsContent value={REPORT_TYPES.MEMBER_ACTIVITY} className="mt-0">
              <MemberActivitySummary data={reportData} />
            </TabsContent>
            
            <TabsContent value={REPORT_TYPES.OVERDUE} className="mt-0">
              <OverdueSummary data={reportData} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
