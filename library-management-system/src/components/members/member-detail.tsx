import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { UserStatus, TransactionStatus, ReservationStatus } from '@prisma/client';
import { ArrowLeftIcon, PencilIcon, LockClosedIcon } from '@heroicons/react/24/outline';

interface Transaction {
  id: string;
  bookId: string;
  book: {
    id: string;
    title: string;
    coverImage: string | null;
  };
  status: TransactionStatus;
  dueDate: string;
  checkoutDate: string;
  returnDate: string | null;
}

interface Reservation {
  id: string;
  bookId: string;
  book: {
    id: string;
    title: string;
    coverImage: string | null;
  };
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}

interface Fine {
  id: string;
  amount: number;
  status: 'PAID' | 'UNPAID';
  createdAt: string;
  transactionId: string;
  transaction: {
    book: {
      title: string;
    }
  };
}

interface Member {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  address: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  profileImage: string | null;
  transactions: Transaction[];
  reservations: Reservation[];
  fines: Fine[];
}

interface MemberDetailProps {
  member?: Member;
  isLoading?: boolean;
}

const MemberStatusBadge = ({ status }: { status: UserStatus }) => {
  const statusStyles = {
    ACTIVE: 'bg-green-100 text-green-800 hover:bg-green-100',
    INACTIVE: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    SUSPENDED: 'bg-red-100 text-red-800 hover:bg-red-100',
    PENDING: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  };

  return (
    <Badge className={statusStyles[status]} variant="outline">
      {status}
    </Badge>
  );
};

const TransactionStatusBadge = ({ status }: { status: TransactionStatus }) => {
  const statusStyles = {
    CHECKED_OUT: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    RETURNED: 'bg-green-100 text-green-800 hover:bg-green-100',
    OVERDUE: 'bg-red-100 text-red-800 hover:bg-red-100',
    LOST: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  };

  return (
    <Badge className={statusStyles[status]} variant="outline">
      {status.replace('_', ' ')}
    </Badge>
  );
};

const ReservationStatusBadge = ({ status }: { status: ReservationStatus }) => {
  const statusStyles = {
    PENDING: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    READY_FOR_PICKUP: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    FULFILLED: 'bg-green-100 text-green-800 hover:bg-green-100',
    EXPIRED: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    CANCELLED: 'bg-red-100 text-red-800 hover:bg-red-100',
  };

  return (
    <Badge className={statusStyles[status]} variant="outline">
      {status.replace('_', ' ')}
    </Badge>
  );
};

const FineStatusBadge = ({ status }: { status: 'PAID' | 'UNPAID' }) => {
  const statusStyles = {
    PAID: 'bg-green-100 text-green-800 hover:bg-green-100',
    UNPAID: 'bg-red-100 text-red-800 hover:bg-red-100',
  };

  return (
    <Badge className={statusStyles[status]} variant="outline">
      {status}
    </Badge>
  );
};

const MemberDetail: React.FC<MemberDetailProps> = ({ 
  member, 
  isLoading = false 
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const goBack = () => {
    router.back();
  };

  const editMember = () => {
    router.push(`/admin/members/${member?.id}/edit`);
  };

  const resetPassword = () => {
    // This would be implemented to trigger password reset functionality
    alert('Password reset functionality would be triggered here');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP');
  };

  if (isLoading) {
    return <MemberDetailSkeleton />;
  }

  if (!member) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p>Member not found</p>
            <Button onClick={goBack} variant="outline" className="mt-4">Go Back</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeBorrowings = member.transactions.filter(
    t => t.status === 'CHECKED_OUT' || t.status === 'OVERDUE'
  );
  
  const activeReservations = member.reservations.filter(
    r => r.status === 'PENDING' || r.status === 'READY_FOR_PICKUP'
  );

  const unpaidFines = member.fines.filter(f => f.status === 'UNPAID');
  
  const totalUnpaidAmount = unpaidFines.reduce((total, fine) => total + fine.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={goBack}
          className="mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Members
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl">Member Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              {member.profileImage ? (
                <AvatarImage src={member.profileImage} alt={member.name} />
              ) : (
                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
              )}
            </Avatar>
            <h3 className="text-lg font-semibold">{member.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{member.email}</p>
            <MemberStatusBadge status={member.status} />
            
            <div className="w-full mt-6 space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Phone</h4>
                <p className="text-sm">{member.phoneNumber || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Address</h4>
                <p className="text-sm">{member.address || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Member Since</h4>
                <p className="text-sm">{formatDate(member.createdAt)}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={editMember}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={resetPassword}
            >
              <LockClosedIcon className="h-4 w-4 mr-2" />
              Reset Password
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full md:w-auto">
                <TabsTrigger value="profile">Overview</TabsTrigger>
                <TabsTrigger value="borrows">Borrows</TabsTrigger>
                <TabsTrigger value="reservations">Reservations</TabsTrigger>
                <TabsTrigger value="fines">Fines</TabsTrigger>
              </TabsList>
            </CardHeader>
          
          <CardContent>
            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Borrows</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{activeBorrowings.length}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Reservations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{activeReservations.length}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Unpaid Fines</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">${totalUnpaidAmount.toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {member.transactions.slice(0, 3).map((transaction) => (
                      <div key={transaction.id} className="flex items-start">
                        <div className="mr-4 mt-1">
                          <Avatar className="h-9 w-9">
                            {transaction.book.coverImage ? (
                              <AvatarImage 
                                src={transaction.book.coverImage} 
                                alt={transaction.book.title} 
                              />
                            ) : (
                              <AvatarFallback>📚</AvatarFallback>
                            )}
                          </Avatar>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {transaction.book.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.status === 'CHECKED_OUT' 
                              ? `Borrowed on ${formatDate(transaction.checkoutDate)}` 
                              : transaction.status === 'RETURNED'
                              ? `Returned on ${formatDate(transaction.returnDate || '')}`
                              : `${transaction.status} on ${formatDate(transaction.checkoutDate)}`
                            }
                          </p>
                          <TransactionStatusBadge status={transaction.status} />
                        </div>
                      </div>
                    ))}
                    
                    {member.transactions.length === 0 && (
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="borrows">
              <Card>
                <CardHeader>
                  <CardTitle>Borrowing History</CardTitle>
                  <CardDescription>
                    All books borrowed by this member
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Book</TableHead>
                        <TableHead>Checkout Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Return Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {member.transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                            No borrowing history found
                          </TableCell>
                        </TableRow>
                      ) : (
                        member.transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">
                              {transaction.book.title}
                            </TableCell>
                            <TableCell>
                              {formatDate(transaction.checkoutDate)}
                            </TableCell>
                            <TableCell>
                              {formatDate(transaction.dueDate)}
                            </TableCell>
                            <TableCell>
                              {transaction.returnDate 
                                ? formatDate(transaction.returnDate) 
                                : '—'
                              }
                            </TableCell>
                            <TableCell>
                              <TransactionStatusBadge status={transaction.status} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reservations">
              <Card>
                <CardHeader>
                  <CardTitle>Reservation History</CardTitle>
                  <CardDescription>
                    All books reserved by this member
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Book</TableHead>
                        <TableHead>Reserved Date</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {member.reservations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                            No reservation history found
                          </TableCell>
                        </TableRow>
                      ) : (
                        member.reservations.map((reservation) => (
                          <TableRow key={reservation.id}>
                            <TableCell className="font-medium">
                              {reservation.book.title}
                            </TableCell>
                            <TableCell>
                              {formatDate(reservation.createdAt)}
                            </TableCell>
                            <TableCell>
                              {formatDate(reservation.updatedAt)}
                            </TableCell>
                            <TableCell>
                              <ReservationStatusBadge status={reservation.status} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="fines">
              <Card>
                <CardHeader>
                  <CardTitle>Fine History</CardTitle>
                  <CardDescription>
                    All fines associated with this member
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Book</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date Issued</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {member.fines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                            No fine history found
                          </TableCell>
                        </TableRow>
                      ) : (
                        member.fines.map((fine) => (
                          <TableRow key={fine.id}>
                            <TableCell className="font-medium">
                              {fine.transaction.book.title}
                            </TableCell>
                            <TableCell>
                              ${fine.amount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {formatDate(fine.createdAt)}
                            </TableCell>
                            <TableCell>
                              <FineStatusBadge status={fine.status} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </CardContent>
          </Card>
      </div>
    </div>
  );
};

const MemberDetailSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Skeleton className="h-24 w-24 rounded-full mb-4" />
            <Skeleton className="h-6 w-36 mb-2" />
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-6 w-20" />
            
            <div className="w-full mt-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardFooter>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <Skeleton className="h-10 w-full md:w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-12" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-start">
                        <Skeleton className="h-9 w-9 rounded-full mr-4" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemberDetail;
