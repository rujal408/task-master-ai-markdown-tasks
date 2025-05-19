'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, ChevronLeft, Calendar, CheckCircle, Book, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { z } from 'zod';

// Types
type BookStatus = 'AVAILABLE' | 'CHECKED_OUT' | 'RESERVED' | 'LOST' | 'DAMAGED' | 'PROCESSING';

interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  status: BookStatus;
  coverImage?: string | null;
}

interface Member {
  id: string;
  name: string;
  email: string;
  membershipNumber: string;
  membershipStatus: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  borrowedBooks: number;
}

// Validation schema for checkout
const checkoutSchema = z.object({
  bookId: z.string().min(1, "Book is required"),
  memberId: z.string().min(1, "Member is required"),
  dueDate: z.date().min(new Date(), "Due date must be in the future"),
  notes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export function CheckoutWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Set default due date to 14 days from now
  useEffect(() => {
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 14);
    setDueDate(defaultDueDate.toISOString().split('T')[0]);
  }, []);

  // Fetch books
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/books');
        if (!response.ok) throw new Error('Failed to fetch books');
        const data = await response.json();
        // Filter only available books
        const availableBooks = data.filter((book: Book) => book.status === 'AVAILABLE');
        setBooks(availableBooks);
        setFilteredBooks(availableBooks);
      } catch (error) {
        console.error('Error fetching books:', error);
        setError('Failed to load books. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  // Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/members');
        if (!response.ok) throw new Error('Failed to fetch members');
        const data = await response.json();
        // Filter only active members
        const activeMembers = data.filter((member: Member) => member.membershipStatus === 'ACTIVE');
        setMembers(activeMembers);
        setFilteredMembers(activeMembers);
      } catch (error) {
        console.error('Error fetching members:', error);
        setError('Failed to load members. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  // Filter books based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter(
        (book) =>
          book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.isbn.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBooks(filtered);
    }
  }, [searchTerm, books]);

  // Filter members based on search term
  useEffect(() => {
    if (memberSearchTerm.trim() === '') {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(
        (member) =>
          member.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
          member.membershipNumber.toLowerCase().includes(memberSearchTerm.toLowerCase())
      );
      setFilteredMembers(filtered);
    }
  }, [memberSearchTerm, members]);

  const handleNextStep = () => {
    if (step === 1 && !selectedBook) {
      setError('Please select a book before proceeding.');
      return;
    } else if (step === 2 && !selectedMember) {
      setError('Please select a member before proceeding.');
      return;
    } else if (step === 3 && !dueDate) {
      setError('Please select a due date before proceeding.');
      return;
    }

    setError('');
    if (step < 4) setStep(step + 1);
  };

  const handlePreviousStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setError('');
  };

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setError('');
  };

  const handleSubmitCheckout = async () => {
    if (!selectedBook || !selectedMember || !dueDate) {
      setError('Please complete all required fields');
      return;
    }

    setLoading(true);
    try {
      const checkoutData = {
        bookId: selectedBook.id,
        memberId: selectedMember.id,
        dueDate: new Date(dueDate),
        notes: notes || undefined,
      };

      const response = await fetch('/api/borrowings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to checkout book');
      }

      setSuccess(true);
      setStep(4); // Move to confirmation step
    } catch (error: any) {
      console.error('Error checking out book:', error);
      setError(error.message || 'Failed to checkout book. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    router.push('/dashboard/borrowings');
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'} mr-2`}>
          <Book className="h-5 w-5" />
        </div>
        <div className={`h-1 w-16 ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`} />
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'} mr-2`}>
          <User className="h-5 w-5" />
        </div>
        <div className={`h-1 w-16 ${step >= 3 ? 'bg-blue-500' : 'bg-gray-200'}`} />
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200'} mr-2`}>
          <Calendar className="h-5 w-5" />
        </div>
        <div className={`h-1 w-16 ${step >= 4 ? 'bg-blue-500' : 'bg-gray-200'}`} />
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 4 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
          <CheckCircle className="h-5 w-5" />
        </div>
      </div>
    );
  };

  const renderBookSelection = () => {
    return (
      <div>
        <CardHeader>
          <CardTitle>Select Book</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by title, author, or ISBN..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {loading ? (
              <div className="col-span-full flex justify-center p-8">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            ) : filteredBooks.length > 0 ? (
              filteredBooks.map((book) => (
                <Card 
                  key={book.id} 
                  className={`cursor-pointer hover:border-blue-500 transition-all ${selectedBook?.id === book.id ? 'border-2 border-blue-500' : ''}`}
                  onClick={() => handleSelectBook(book)}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col h-full">
                      <div className="text-lg font-semibold mb-2 line-clamp-1">{book.title}</div>
                      <div className="text-sm text-gray-500 mb-2">by {book.author}</div>
                      <div className="text-xs text-gray-400 mb-4">ISBN: {book.isbn}</div>
                      <div className="mt-auto">
                        <Badge>Available</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center p-8 text-gray-500">
                No available books found.
              </div>
            )}
          </div>
        </CardContent>
      </div>
    );
  };

  const renderMemberSelection = () => {
    return (
      <div>
        <CardHeader>
          <CardTitle>Select Member</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or membership number..."
              className="pl-10 w-full"
              value={memberSearchTerm}
              onChange={(e) => setMemberSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {loading ? (
              <div className="col-span-full flex justify-center p-8">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            ) : filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <Card 
                  key={member.id} 
                  className={`cursor-pointer hover:border-blue-500 transition-all ${selectedMember?.id === member.id ? 'border-2 border-blue-500' : ''}`}
                  onClick={() => handleSelectMember(member)}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col">
                      <div className="text-lg font-semibold mb-2">{member.name}</div>
                      <div className="text-sm text-gray-500 mb-2">{member.email}</div>
                      <div className="text-xs text-gray-400 mb-2">ID: {member.membershipNumber}</div>
                      <div className="flex justify-between items-center mt-2">
                        <Badge variant="secondary">Books: {member.borrowedBooks}</Badge>
                        <Badge className="bg-green-500">Active</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center p-8 text-gray-500">
                No active members found.
              </div>
            )}
          </div>
        </CardContent>
      </div>
    );
  };

  const renderDueDateSelection = () => {
    return (
      <div>
        <CardHeader>
          <CardTitle>Set Due Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <label htmlFor="due-date" className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="due-date"
                type="date"
                className="pl-10"
                min={new Date().toISOString().split('T')[0]}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any notes about this checkout..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Checkout Summary</h3>
            {selectedBook && (
              <div className="mb-2">
                <span className="text-sm font-medium">Book:</span>{' '}
                <span className="text-sm">{selectedBook.title} by {selectedBook.author}</span>
              </div>
            )}
            {selectedMember && (
              <div className="mb-2">
                <span className="text-sm font-medium">Member:</span>{' '}
                <span className="text-sm">{selectedMember.name} ({selectedMember.membershipNumber})</span>
              </div>
            )}
            {dueDate && (
              <div>
                <span className="text-sm font-medium">Due Date:</span>{' '}
                <span className="text-sm">{new Date(dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    );
  };

  const renderConfirmation = () => {
    return (
      <div>
        <CardHeader>
          <CardTitle className="text-center text-green-600">Checkout Complete!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <p className="mb-6">
            <span className="font-semibold">{selectedBook?.title}</span> has been successfully
            checked out to <span className="font-semibold">{selectedMember?.name}</span>.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg text-left mb-8 mx-auto max-w-lg">
            <h3 className="font-semibold mb-2">Checkout Details</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Book:</div>
              <div className="text-sm">{selectedBook?.title}</div>
              
              <div className="text-sm font-medium">Member:</div>
              <div className="text-sm">{selectedMember?.name}</div>
              
              <div className="text-sm font-medium">Due Date:</div>
              <div className="text-sm">{new Date(dueDate).toLocaleDateString()}</div>
              
              <div className="text-sm font-medium">Checkout Date:</div>
              <div className="text-sm">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => {
                // Reset the form for a new checkout
                setSelectedBook(null);
                setSelectedMember(null);
                const defaultDueDate = new Date();
                defaultDueDate.setDate(defaultDueDate.getDate() + 14);
                setDueDate(defaultDueDate.toISOString().split('T')[0]);
                setNotes('');
                setStep(1);
              }}
            >
              New Checkout
            </Button>
            <Button onClick={handleFinish}>View All Borrowings</Button>
          </div>
        </CardContent>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      {renderStepIndicator()}

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <Card>
        {step === 1 && renderBookSelection()}
        {step === 2 && renderMemberSelection()}
        {step === 3 && renderDueDateSelection()}
        {step === 4 && renderConfirmation()}

        {step < 4 && (
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={step === 1 || loading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {step < 3 ? (
              <Button 
                onClick={handleNextStep}
                disabled={loading}
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmitCheckout}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                    Processing...
                  </>
                ) : (
                  <>Confirm Checkout</>
                )}
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
