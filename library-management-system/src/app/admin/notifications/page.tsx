'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, AlertCircle, Mail } from 'lucide-react';

interface NotificationType {
  id: string;
  name: string;
  description: string;
}

interface NotificationResult {
  processed: number;
  sent: number;
  failed: number;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [result, setResult] = useState<NotificationResult | null>(null);
  const [success, setSuccess] = useState(false);
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([]);

  // Check if user is authorized
  const isAuthorized = 
    session?.user?.role === UserRole.ADMIN || 
    session?.user?.role === UserRole.LIBRARIAN;

  // Fetch notification types on mount
  useEffect(() => {
    const fetchNotificationTypes = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (!response.ok) {
          throw new Error('Failed to fetch notification types');
        }
        const data = await response.json();
        setNotificationTypes(data.notificationTypes);
      } catch (error) {
        console.error('Error fetching notification types:', error);
        setError('Failed to load notification types. Please try again later.');
        toast({
          title: 'Error',
          description: 'Failed to load notification types. Please try again later.',
        });
      }
    };

    if (isAuthorized) {
      fetchNotificationTypes();
    }
  }, [isAuthorized]);

  // Handle sending notifications
  const handleSendNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setResult(null);

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: selectedType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send notifications');
      }

      const data = await response.json();
      
      // Handle the different result structures based on notification type
      if (selectedType === 'all') {
        setResult(data.result.total);
      } else {
        setResult(data.result);
      }
      
      setSuccess(true);
      if (result) {
        toast({
          title: 'Success',
          description: `Successfully processed ${result.sent} notifications`,
        });
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="container mx-auto p-6">
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-800">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5" />
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
      <h1 className="text-2xl font-bold mb-6">Email Notifications</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Send Notifications</CardTitle>
          <CardDescription>
            Manually trigger notification emails to library members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Notification Type
              </label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Select notification type" />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-sm text-gray-500">
                {notificationTypes.find(t => t.id === selectedType)?.description}
              </p>
            </div>

            <Button
              onClick={handleSendNotifications}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Notifications
                </>
              )}
            </Button>

            {error && (
              <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-800 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="font-semibold">Error</h3>
                </div>
                <p>{error}</p>
              </div>
            )}

            {success && result && (
              <div className="mt-4 p-4 rounded-md bg-green-50 border border-green-200 text-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <h3 className="font-semibold">Notifications Processed</h3>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <div className="p-2 bg-gray-100 rounded">
                    <p className="font-medium">Processed</p>
                    <p className="text-xl">{result.processed}</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <p className="font-medium text-green-700">Sent</p>
                    <p className="text-xl text-green-700">{result.sent}</p>
                  </div>
                  <div className="p-2 bg-red-50 rounded">
                    <p className="font-medium text-red-700">Failed</p>
                    <p className="text-xl text-red-700">{result.failed}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Email Notification Schedule</CardTitle>
          <CardDescription>
            When notifications are automatically sent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded border p-4">
              <h3 className="font-medium mb-2">Due Date Reminders</h3>
              <p className="text-sm text-gray-600">
                Sent automatically when books are due in:
              </p>
              <ul className="list-disc list-inside text-sm ml-2 mt-1">
                <li>1 day before due date</li>
                <li>3 days before due date</li>
                <li>7 days before due date</li>
              </ul>
            </div>

            <div className="rounded border p-4">
              <h3 className="font-medium mb-2">Overdue Notices</h3>
              <p className="text-sm text-gray-600">
                Sent automatically when books are overdue by:
              </p>
              <ul className="list-disc list-inside text-sm ml-2 mt-1">
                <li>1 day overdue</li>
                <li>7 days overdue</li>
                <li>14 days overdue</li>
              </ul>
            </div>

            <div className="rounded border p-4">
              <h3 className="font-medium mb-2">Reservation Notifications</h3>
              <p className="text-sm text-gray-600">
                Sent automatically:
              </p>
              <ul className="list-disc list-inside text-sm ml-2 mt-1">
                <li>When a reserved book becomes available</li>
                <li>1 day before reservation expires</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
