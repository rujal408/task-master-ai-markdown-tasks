"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, BookOpen, BookX, BookCheck, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

type Transaction = {
  id: string;
  bookId: string;
  book: {
    title: string;
    author: string;
  };
  checkoutDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  fine: number;
};

type Reservation = {
  id: string;
  bookId: string;
  book: {
    title: string;
    author: string;
  };
  reservationDate: string;
  expiryDate: string;
  status: string;
};

type Activity = {
  transactions: Transaction[];
  reservations: Reservation[];
};

export function ActivityHistory() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [activity, setActivity] = useState<Activity>({
    transactions: [],
    reservations: [],
  });

  useEffect(() => {
    async function fetchActivity() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/users/activity");
        
        if (!response.ok) {
          throw new Error("Failed to fetch activity data");
        }
        
        const data = await response.json();
        setActivity(data);
      } catch (error) {
        console.error("Error fetching activity:", error);
        toast({
          title: "Error",
          description: "Failed to load activity history",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchActivity();
  }, [toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CHECKED_OUT":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Checked Out</Badge>;
      case "OVERDUE":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Overdue</Badge>;
      case "RETURNED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Returned</Badge>;
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "FULFILLED":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Fulfilled</Badge>;
      case "EXPIRED":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const hasActivity = activity.transactions.length > 0 || activity.reservations.length > 0;

  if (!hasActivity) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
        <h3 className="text-lg font-medium">No activity yet</h3>
        <p className="text-muted-foreground mt-1">
          Your borrowing and reservation history will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activity.transactions.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Recent Borrowings</h3>
          <div className="space-y-3">
            {activity.transactions.map((transaction) => (
              <Card key={transaction.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="grid gap-1">
                      <div className="font-medium">{transaction.book.title}</div>
                      <div className="text-sm text-muted-foreground">by {transaction.book.author}</div>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <div className="flex items-center gap-1">
                          <BookCheck className="h-4 w-4 text-muted-foreground" />
                          <span>Borrowed: {formatDate(transaction.checkoutDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarClock className="h-4 w-4 text-muted-foreground" />
                          <span>Due: {formatDate(transaction.dueDate)}</span>
                        </div>
                      </div>
                      {transaction.returnDate && (
                        <div className="flex items-center gap-1 text-sm">
                          <BookCheck className="h-4 w-4 text-green-600" />
                          <span>Returned: {formatDate(transaction.returnDate)}</span>
                        </div>
                      )}
                      {transaction.fine > 0 && (
                        <div className="text-sm font-medium text-red-600 mt-1">
                          Fine: ${transaction.fine.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {activity.reservations.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Recent Reservations</h3>
          <div className="space-y-3">
            {activity.reservations.map((reservation) => (
              <Card key={reservation.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="grid gap-1">
                      <div className="font-medium">{reservation.book.title}</div>
                      <div className="text-sm text-muted-foreground">by {reservation.book.author}</div>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <div className="flex items-center gap-1">
                          <BookCheck className="h-4 w-4 text-muted-foreground" />
                          <span>Reserved: {formatDate(reservation.reservationDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarClock className="h-4 w-4 text-muted-foreground" />
                          <span>Expires: {formatDate(reservation.expiryDate)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(reservation.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
