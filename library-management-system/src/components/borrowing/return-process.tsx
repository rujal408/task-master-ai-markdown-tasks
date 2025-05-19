'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Check, X, AlertCircle, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { z } from 'zod';

// Types
interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  coverImage?: string | null;
}

interface Member {
  id: string;
  name: string;
  email: string;
  membershipNumber: string;
}

interface BorrowingRecord {
  id: string;
  bookId: string;
  memberId: string;
  checkoutDate: string;
  dueDate: string;
  returnDate: string | null;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'LOST';
  book: Book;
  member: Member;
}

// Validation schema for return
const returnSchema = z.object({
  borrowingId: z.string().min(1, "Borrowing record is required"),
  returnDate: z.date().default(() => new Date()),
  condition: z.enum(['GOOD', 'DAMAGED', 'LOST']),
  fineAmount: z.number().min(0).optional(),
  fineReason: z.string().optional(),
  paidStatus: z.boolean().default(false),
  notes: z.string().optional(),
});

type ReturnFormValues = z.infer<typeof returnSchema>;

export function ReturnProcess() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [borrowings, setBorrowings] = useState<BorrowingRecord[]>([]);
  const [filteredBorrowings, setFilteredBorrowings] = useState<BorrowingRecord[]>([]);
  const [selectedBorrowing, setSelectedBorrowing] = useState<BorrowingRecord | null>(null);
  const [bookCondition, setBookCondition] = useState<'GOOD' | 'DAMAGED' | 'LOST'>('GOOD');
  const [fineAmount, setFineAmount] = useState(0);
  const [fineReason, setFineReason] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [returnComplete, setReturnComplete] = useState(false);

  // Fetch active borrowings
  useEffect(() => {
    const fetchBorrowings = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/borrowings?status=ACTIVE');
        if (!response.ok) throw new Error('Failed to fetch borrowings');
        const data = await response.json();
        setBorrowings(data);
        setFilteredBorrowings(data);
      } catch (error) {
        console.error('Error fetching borrowings:', error);
        setError('Failed to load borrowings. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchBorrowings();
  }, []);

  // Filter borrowings based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredBorrowings(borrowings);
    } else {
      const filtered = borrowings.filter(
        (borrowing) =>
          borrowing.book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          borrowing.book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
          borrowing.book.isbn.toLowerCase().includes(searchTerm.toLowerCase()) ||
          borrowing.member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          borrowing.member.membershipNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBorrowings(filtered);
    }
  }, [searchTerm, borrowings]);

  const handleSelectBorrowing = (borrowing: BorrowingRecord) => {
    setSelectedBorrowing(borrowing);
    setBookCondition('GOOD');
    setFineAmount(0);
    setFineReason('');
    setIsPaid(false);
    setNotes('');
    setError('');
    
    // Check if book is overdue, calculate fine if needed
    const dueDate = new Date(borrowing.dueDate);
    const today = new Date();
    if (dueDate < today) {
      const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
      const calculatedFine = daysOverdue * 0.50; // $0.50 per day
      setFineAmount(calculatedFine);
      setFineReason(`${daysOverdue} days overdue @ $0.50/day`);
    }
  };

  const handleConditionChange = (condition: 'GOOD' | 'DAMAGED' | 'LOST') => {
    setBookCondition(condition);
    
    // Set fine based on condition
    if (condition === 'DAMAGED') {
      const currentFine = fineAmount > 0 ? fineAmount : 0;
      setFineAmount(currentFine + 10.00);
      setFineReason(fineReason ? `${fineReason}, Damaged item fee: $10.00` : 'Damaged item fee: $10.00');
    } else if (condition === 'LOST') {
      // Assume replacement cost is $30
      setFineAmount(30.00);
      setFineReason('Replacement cost for lost item');
    } else if (condition === 'GOOD') {
      // Keep overdue fine if exists, but remove damage/loss fees
      const dueDate = new Date(selectedBorrowing?.dueDate || new Date());
      const today = new Date();
      if (dueDate < today) {
        const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
        const calculatedFine = daysOverdue * 0.50; // $0.50 per day
        setFineAmount(calculatedFine);
        setFineReason(`${daysOverdue} days overdue @ $0.50/day`);
      } else {
        setFineAmount(0);
        setFineReason('');
      }
    }
  };

  const handleBookReturn = async () => {
    if (!selectedBorrowing) {
      setError('Please select a borrowing record');
      return;
    }

    setLoading(true);
    try {
      const returnData = {
        borrowingId: selectedBorrowing.id,
        condition: bookCondition,
        fineAmount: fineAmount > 0 ? fineAmount : undefined,
        fineReason: fineReason || undefined,
        isPaid,
        notes: notes || undefined,
      };

      const response = await fetch(`/api/borrowings/${selectedBorrowing.id}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(returnData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process return');
      }

      // Remove returned book from the list
      const updatedBorrowings = borrowings.filter(b => b.id !== selectedBorrowing.id);
      setBorrowings(updatedBorrowings);
      setFilteredBorrowings(updatedBorrowings);
      setReturnComplete(true);
    } catch (error: any) {
      console.error('Error processing return:', error);
      setError(error.message || 'Failed to process return. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    setSelectedBorrowing(null);
    setReturnComplete(false);
  };

  const calculateDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    if (due >= today) return 0;
    
    return Math.ceil((today.getTime() - due.getTime()) / (1000 * 3600 * 24));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderBorrowingSearch = () => {
    return (
      <div>
        <CardHeader>
          <CardTitle>Book Return Scanner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by book title, ISBN, or member name..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-hidden rounded-md border">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Loading borrowings...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredBorrowings.length > 0 ? (
                  filteredBorrowings.map((borrowing) => {
                    const daysOverdue = calculateDaysOverdue(borrowing.dueDate);
                    const isOverdue = daysOverdue > 0;
                    
                    return (
                      <tr 
                        key={borrowing.id} 
                        className={`hover:bg-gray-50 cursor-pointer ${selectedBorrowing?.id === borrowing.id ? 'bg-blue-50' : ''}`}
                        onClick={() => handleSelectBorrowing(borrowing)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="font-medium text-gray-900">{borrowing.book.title}</div>
                              <div className="text-sm text-gray-500">{borrowing.book.author}</div>
                              <div className="text-xs text-gray-400">ISBN: {borrowing.book.isbn}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{borrowing.member.name}</div>
                          <div className="text-xs text-gray-500">{borrowing.member.membershipNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(borrowing.dueDate)}</div>
                          {isOverdue && (
                            <div className="text-xs text-red-500">{daysOverdue} days overdue</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={isOverdue ? "destructive" : "secondary"}>
                            {isOverdue ? "OVERDUE" : "ACTIVE"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectBorrowing(borrowing);
                            }}
                          >
                            Return
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No active borrowings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </div>
    );
  };

  const renderReturnForm = () => {
    if (!selectedBorrowing) return null;

    return (
      <div>
        <CardHeader>
          <CardTitle>Book Return Form</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">Return Details</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Book:</div>
              <div className="text-sm">{selectedBorrowing.book.title}</div>
              
              <div className="text-sm font-medium">Member:</div>
              <div className="text-sm">{selectedBorrowing.member.name}</div>
              
              <div className="text-sm font-medium">Checkout Date:</div>
              <div className="text-sm">{formatDate(selectedBorrowing.checkoutDate)}</div>
              
              <div className="text-sm font-medium">Due Date:</div>
              <div className="text-sm">
                {formatDate(selectedBorrowing.dueDate)}
                {calculateDaysOverdue(selectedBorrowing.dueDate) > 0 && (
                  <span className="text-red-500 ml-2">
                    ({calculateDaysOverdue(selectedBorrowing.dueDate)} days overdue)
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Book Condition Assessment</h3>
              <RadioGroup 
                value={bookCondition} 
                onValueChange={(value: 'GOOD' | 'DAMAGED' | 'LOST') => handleConditionChange(value)}
                className="grid grid-cols-3 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="GOOD" id="condition-good" />
                  <Label htmlFor="condition-good">Good</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="DAMAGED" id="condition-damaged" />
                  <Label htmlFor="condition-damaged">Damaged</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="LOST" id="condition-lost" />
                  <Label htmlFor="condition-lost">Lost</Label>
                </div>
              </RadioGroup>
            </div>
            
            {fineAmount > 0 && (
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                  <h3 className="font-semibold text-amber-800">Fines Applicable</h3>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-amber-800">{fineReason}</p>
                  <p className="text-lg font-bold mt-1">${fineAmount.toFixed(2)}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="payment-status" className="text-sm">Payment Collected?</Label>
                  <Switch 
                    id="payment-status" 
                    checked={isPaid}
                    onCheckedChange={setIsPaid}
                  />
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any notes about this return..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setSelectedBorrowing(null)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleBookReturn}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                Processing...
              </>
            ) : (
              <>Confirm Return</>
            )}
          </Button>
        </CardFooter>
      </div>
    );
  };

  const renderReturnSuccess = () => {
    return (
      <div>
        <CardHeader>
          <CardTitle className="text-center text-green-600">Return Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex justify-center mb-6">
            <Check className="h-16 w-16 text-green-500" />
          </div>
          <p className="mb-6">
            <span className="font-semibold">{selectedBorrowing?.book.title}</span> has been successfully
            returned from <span className="font-semibold">{selectedBorrowing?.member.name}</span>.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg text-left mb-8 mx-auto max-w-lg">
            <h3 className="font-semibold mb-2">Return Details</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Book:</div>
              <div className="text-sm">{selectedBorrowing?.book.title}</div>
              
              <div className="text-sm font-medium">Condition:</div>
              <div className="text-sm">{bookCondition}</div>
              
              {fineAmount > 0 && (
                <>
                  <div className="text-sm font-medium">Fine:</div>
                  <div className="text-sm">${fineAmount.toFixed(2)} ({isPaid ? 'Paid' : 'Unpaid'})</div>
                </>
              )}
              
              <div className="text-sm font-medium">Return Date:</div>
              <div className="text-sm">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
          <div className="flex justify-center space-x-4">
            <Button variant="default" onClick={handleFinish}>
              Process Another Return
            </Button>
          </div>
        </CardContent>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <Card>
        {returnComplete ? renderReturnSuccess() : 
          selectedBorrowing ? renderReturnForm() : renderBorrowingSearch()}
      </Card>
    </div>
  );
}
