'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole, BookStatus } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  Download, 
  FileText, 
  BarChart3, 
  PieChart, 
  BookOpen, 
  ArrowRight, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react';
import InventorySummary from './components/inventory-summary';
import CirculationSummary from './components/circulation-summary';
import MaintenanceSummary from './components/maintenance-summary';


// Define the report types
const REPORT_TYPES = {
  INVENTORY: 'inventory',
  CIRCULATION: 'circulation',
  MAINTENANCE: 'maintenance',
};

// Define the timeframe options
const TIMEFRAME_OPTIONS = [
  { value: 'day', label: 'Last 24 Hours' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last 12 Months' },
  { value: 'all', label: 'All Time' },
];

// Define the format options
const FORMAT_OPTIONS = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
];

export default function InventoryReportsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState(REPORT_TYPES.INVENTORY);
  const [timeframe, setTimeframe] = useState('month');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<BookStatus | undefined>(undefined);
  const [format, setFormat] = useState('json');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [categories, setCategories] = useState<string[]>([]);
  const [inventoryData, setInventoryData] = useState(null);
  const [circulationData, setCirculationData] = useState(null);
  const [maintenanceData, setMaintenanceData] = useState(null);

  // Check if user is authorized
  const isAuthorized = 
    session?.user?.role === UserRole.ADMIN || 
    session?.user?.role === UserRole.LIBRARIAN;
  
  // Fetch list of categories for filter dropdown
  useEffect(() => {
    if (isAuthorized) {
      fetchCategories();
    }
  }, [isAuthorized]);

  // Fetch report data when parameters change
  useEffect(() => {
    if (isAuthorized) {
      fetchReportData();
    }
  }, [isAuthorized, activeTab, timeframe, category, status]);

  // Fetch book categories from the API
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/books/categories');
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load book categories',
      });
    }
  };

  // Fetch report data based on current parameters
  const fetchReportData = async () => {
    if (!isAuthorized) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('timeframe', timeframe);
      if (category) params.append('category', category);
      if (status) params.append('status', status);
      
      // Determine endpoint based on active tab
      let endpoint = '/api/reports/inventory';
      
      if (activeTab === REPORT_TYPES.CIRCULATION) {
        endpoint = '/api/reports/inventory/circulation';
      } else if (activeTab === REPORT_TYPES.MAINTENANCE) {
        endpoint = '/api/reports/inventory/maintenance';
      }
      
      // Fetch the report data
      const response = await fetch(`${endpoint}?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch report data');
      }
      
      const data = await response.json();
      
      // Update the appropriate state based on active tab
      if (activeTab === REPORT_TYPES.INVENTORY) {
        setInventoryData(data.report);
      } else if (activeTab === REPORT_TYPES.CIRCULATION) {
        setCirculationData(data.report);
      } else if (activeTab === REPORT_TYPES.MAINTENANCE) {
        setMaintenanceData(data.report);
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab} report:`, error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      toast({
        title: 'Error',
        description: `Failed to load ${activeTab} report data`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle report export
  const handleExportReport = async () => {
    try {
      // Build export parameters
      const params = new URLSearchParams();
      params.append('format', 'csv');
      params.append('timeframe', timeframe);
      if (category) params.append('category', category);
      if (status) params.append('status', status);
      
      // Determine endpoint based on active tab
      let endpoint = '/api/reports/inventory';
      
      if (activeTab === REPORT_TYPES.CIRCULATION) {
        endpoint = '/api/reports/inventory/circulation';
      } else if (activeTab === REPORT_TYPES.MAINTENANCE) {
        endpoint = '/api/reports/inventory/maintenance';
      }
      
      // Redirect to CSV download URL
      window.location.href = `${endpoint}?${params.toString()}`;
      
      toast({
        title: 'Export Started',
        description: 'Your report export has started and will download shortly.',
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export report. Please try again.',
      });
    }
  };

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
      <h1 className="text-2xl font-bold mb-6">Inventory Reports</h1>
      
      {/* Report Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value={REPORT_TYPES.INVENTORY}>
            <BookOpen className="h-4 w-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value={REPORT_TYPES.CIRCULATION}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Circulation
          </TabsTrigger>
          <TabsTrigger value={REPORT_TYPES.MAINTENANCE}>
            <PieChart className="h-4 w-4 mr-2" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        {/* Filter Controls */}
        <Card className="mt-4 mb-6">
          <CardHeader>
            <CardTitle>Report Parameters</CardTitle>
            <CardDescription>
              Configure the report timeframe and filters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Timeframe
                </label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEFRAME_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <Select value={category || ''} onValueChange={(val) => setCategory(val || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {activeTab !== REPORT_TYPES.CIRCULATION && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <Select 
                    value={status || ''} 
                    onValueChange={(val) => setStatus(val as BookStatus || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      {Object.values(BookStatus).map((stat) => (
                        <SelectItem key={stat} value={stat}>
                          {stat.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={handleExportReport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Report (CSV)
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Loading and Error States */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading report data...</span>
          </div>
        )}
        
        {error && !loading && (
          <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-800 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-semibold">Error</h3>
            </div>
            <p>{error}</p>
          </div>
        )}
        
        {/* Report Content Areas */}
        {!loading && !error && (
          <>
            <TabsContent value={REPORT_TYPES.INVENTORY} className="mt-0">
              <InventorySummary data={inventoryData} />
            </TabsContent>
            
            <TabsContent value={REPORT_TYPES.CIRCULATION} className="mt-0">
              <CirculationSummary data={circulationData} />
            </TabsContent>
            
            <TabsContent value={REPORT_TYPES.MAINTENANCE} className="mt-0">
              <MaintenanceSummary data={maintenanceData} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
