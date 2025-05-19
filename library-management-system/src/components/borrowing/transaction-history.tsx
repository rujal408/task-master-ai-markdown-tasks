'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Search, 
  Download, 
  ChevronDown, 
  Eye, 
  ArrowUpDown,
  FileText,
  Loader2
} from 'lucide-react';
import { CheckoutReceiptDialog } from '@/components/borrowing/checkout-receipt';
import { ReturnReceiptDialog } from '@/components/borrowing/return-receipt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Types
type TransactionStatus = 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'LOST';

interface Transaction {
  id: string;
  bookId: string;
  memberId: string;
  bookTitle: string;
  bookAuthor: string;
  bookIsbn: string;
  memberName: string;
  membershipNumber: string;
  checkoutDate: string;
  dueDate: string;
  returnDate: string | null;
  status: TransactionStatus;
  fineAmount: number | null;
  finePaid: boolean;
  notes: string | null;
}

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [sortField, setSortField] = useState<keyof Transaction>('checkoutDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [error, setError] = useState('');

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/borrowings');
        if (!response.ok) throw new Error('Failed to fetch transactions');
        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError('Failed to load transaction history. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  // Apply filters and sorting
  const filteredAndSortedTransactions = useMemo(() => {
    let results = [...transactions];
    
    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      results = results.filter(
        (transaction) =>
          transaction.bookTitle.toLowerCase().includes(searchLower) ||
          transaction.bookAuthor.toLowerCase().includes(searchLower) ||
          transaction.bookIsbn.toLowerCase().includes(searchLower) ||
          transaction.memberName.toLowerCase().includes(searchLower) ||
          transaction.membershipNumber.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      results = results.filter(
        (transaction) => transaction.status === statusFilter
      );
    }
    
    // Apply date range filter
    if (startDate) {
      const start = new Date(startDate);
      results = results.filter(
        (transaction) => new Date(transaction.checkoutDate) >= start
      );
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
      results = results.filter(
        (transaction) => new Date(transaction.checkoutDate) <= end
      );
    }
    
    // Apply sorting
    results.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue === null) return sortDirection === 'asc' ? -1 : 1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Handle number comparison
      const numA = Number(aValue);
      const numB = Number(bValue);
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    });
    
    return results;
  }, [transactions, searchTerm, statusFilter, startDate, endDate, sortField, sortDirection]);

  const handleSort = (field: keyof Transaction) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailOpen(true);
  };

  const handleExportCSV = () => {
    if (filteredAndSortedTransactions.length === 0) return;
    
    const headers = [
      'Transaction ID',
      'Book Title',
      'Book Author',
      'ISBN',
      'Member Name',
      'Membership ID',
      'Checkout Date',
      'Due Date',
      'Return Date',
      'Status',
      'Fine Amount',
      'Fine Paid',
      'Notes'
    ];
    
    const csvRows = [
      headers.join(','),
      ...filteredAndSortedTransactions.map(t => [
        t.id,
        `"${t.bookTitle.replace(/"/g, '""')}"`,
        `"${t.bookAuthor.replace(/"/g, '""')}"`,
        t.bookIsbn,
        `"${t.memberName.replace(/"/g, '""')}"`,
        t.membershipNumber,
        new Date(t.checkoutDate).toLocaleDateString(),
        new Date(t.dueDate).toLocaleDateString(),
        t.returnDate ? new Date(t.returnDate).toLocaleDateString() : '',
        t.status,
        t.fineAmount || '',
        t.finePaid ? 'YES' : 'NO',
        t.notes ? `"${t.notes.replace(/"/g, '""')}"` : ''
      ].join(','))
    ];
    
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `library-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="secondary">Active</Badge>;
      case 'RETURNED':
        return <Badge variant="success" className="bg-green-500">Returned</Badge>;
      case 'OVERDUE':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'LOST':
        return <Badge variant="outline" className="bg-gray-200 text-gray-800">Lost</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative w-full sm:w-1/3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search transactions..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="w-full sm:w-1/5">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="RETURNED">Returned</SelectItem>
                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                    <SelectItem value="LOST">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="date"
                    className="pl-10"
                    placeholder="Start Date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <span>to</span>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="date"
                    className="pl-10"
                    placeholder="End Date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Export Button */}
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={handleExportCSV}
                disabled={filteredAndSortedTransactions.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export as CSV
              </Button>
            </div>
            
            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('bookTitle')}>
                      <div className="flex items-center">
                        Book
                        {sortField === 'bookTitle' && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('memberName')}>
                      <div className="flex items-center">
                        Member
                        {sortField === 'memberName' && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('checkoutDate')}>
                      <div className="flex items-center">
                        Checkout Date
                        {sortField === 'checkoutDate' && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('dueDate')}>
                      <div className="flex items-center">
                        Due Date
                        {sortField === 'dueDate' && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('status')}>
                      <div className="flex items-center">
                        Status
                        {sortField === 'status' && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          <span>Loading transactions...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredAndSortedTransactions.length > 0 ? (
                    filteredAndSortedTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900">{transaction.bookTitle}</div>
                          <div className="text-xs text-gray-500">{transaction.bookAuthor}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div>{transaction.memberName}</div>
                          <div className="text-xs text-gray-500">{transaction.membershipNumber}</div>
                        </td>
                        <td className="px-4 py-4">
                          {formatDate(transaction.checkoutDate)}
                        </td>
                        <td className="px-4 py-4">
                          {formatDate(transaction.dueDate)}
                        </td>
                        <td className="px-4 py-4">
                          {getStatusBadge(transaction.status)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(transaction)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                        No transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{selectedTransaction.bookTitle}</h3>
                  <p className="text-sm text-gray-500">by {selectedTransaction.bookAuthor}</p>
                </div>
                {getStatusBadge(selectedTransaction.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Book Details</h4>
                  <p className="text-sm mt-1">ISBN: {selectedTransaction.bookIsbn}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Member</h4>
                  <p className="text-sm mt-1">{selectedTransaction.memberName}</p>
                  <p className="text-xs text-gray-500">ID: {selectedTransaction.membershipNumber}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-md p-3">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Timeline</h4>
                <div className="space-y-3">
                  <div className="flex">
                    <div className="w-1/3 text-sm font-medium">Checkout Date:</div>
                    <div className="w-2/3 text-sm">{formatDate(selectedTransaction.checkoutDate)}</div>
                  </div>
                  <div className="flex">
                    <div className="w-1/3 text-sm font-medium">Due Date:</div>
                    <div className="w-2/3 text-sm">{formatDate(selectedTransaction.dueDate)}</div>
                  </div>
                  <div className="flex">
                    <div className="w-1/3 text-sm font-medium">Return Date:</div>
                    <div className="w-2/3 text-sm">
                      {selectedTransaction.returnDate ? formatDate(selectedTransaction.returnDate) : '-'}
                    </div>
                  </div>
                </div>
              </div>
              
              {(selectedTransaction.fineAmount !== null && selectedTransaction.fineAmount > 0) && (
                <div className="rounded-md p-3 bg-amber-50 border border-amber-200">
                  <h4 className="text-sm font-medium text-amber-800 mb-2">Fine Information</h4>
                  <div className="flex justify-between items-center">
                    <div className="text-amber-800">Amount: ${selectedTransaction.fineAmount.toFixed(2)}</div>
                    <Badge variant={selectedTransaction.finePaid ? "success" : "outline"} className={selectedTransaction.finePaid ? "bg-green-500" : ""}>
                      {selectedTransaction.finePaid ? "Paid" : "Unpaid"}
                    </Badge>
                  </div>
                </div>
              )}
              
              {selectedTransaction.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">{selectedTransaction.notes}</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 mt-4">
                {selectedTransaction.returnDate ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center"
                  onClick={() => {
                    setIsDetailOpen(false);
                    // A small delay to ensure dialog closes properly before opening new one
                    setTimeout(() => {
                      document.getElementById(`return-receipt-${selectedTransaction.id}`)?.click();
                    }, 100);
                  }}
                >
                  <FileText className="mr-1 h-4 w-4" />
                  Return Receipt
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center"
                  onClick={() => {
                    setIsDetailOpen(false);
                    // A small delay to ensure dialog closes properly before opening new one
                    setTimeout(() => {
                      document.getElementById(`checkout-receipt-${selectedTransaction.id}`)?.click();
                    }, 100);
                  }}
                >
                  <FileText className="mr-1 h-4 w-4" />
                  Checkout Receipt
                </Button>
              )}
                <Button 
                  size="sm"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialogs (Hidden) */}
      {transactions.map((transaction) => (
        <div key={transaction.id} className="hidden">
          {/* Checkout Receipt Dialog */}
          <CheckoutReceiptDialog 
            borrowingId={transaction.id}
            bookTitle={transaction.bookTitle}
            bookAuthor={transaction.bookAuthor}
            bookIsbn={transaction.bookIsbn}
            memberName={transaction.memberName}
            membershipNumber={transaction.membershipNumber}
            checkoutDate={transaction.checkoutDate}
            dueDate={transaction.dueDate}
            notes={transaction.notes || undefined}
            trigger={
              <button id={`checkout-receipt-${transaction.id}`}>Open Receipt</button>
            }
          />
          
          {/* Return Receipt Dialog (only for returned items) */}
          {transaction.returnDate && (
            <ReturnReceiptDialog 
              borrowingId={transaction.id}
              bookTitle={transaction.bookTitle}
              bookAuthor={transaction.bookAuthor}
              bookIsbn={transaction.bookIsbn}
              memberName={transaction.memberName}
              membershipNumber={transaction.membershipNumber}
              checkoutDate={transaction.checkoutDate}
              dueDate={transaction.dueDate}
              returnDate={transaction.returnDate}
              condition={transaction.status === 'LOST' ? 'LOST' : transaction.status === 'OVERDUE' ? 'DAMAGED' : 'GOOD'}
              fineAmount={transaction.fineAmount}
              finePaid={transaction.finePaid}
              notes={transaction.notes || undefined}
              trigger={
                <button id={`return-receipt-${transaction.id}`}>Open Receipt</button>
              }
            />
          )}
        </div>
      ))}
    </div>
  );
}
