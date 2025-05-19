'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Loader2, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '../ui/badge';

type BookStatus = 'AVAILABLE' | 'CHECKED_OUT' | 'RESERVED' | 'LOST' | 'DAMAGED' | 'PROCESSING';

const statusVariant = {
  AVAILABLE: 'success',
  CHECKED_OUT: 'warning',
  RESERVED: 'info',
  LOST: 'destructive',
  DAMAGED: 'destructive',
  PROCESSING: 'secondary',
};

interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  status: BookStatus;
  description?: string | null;
  edition?: string | null;
  language?: string | null;
  pageCount?: number | null;
  publishedYear?: number | null;
  publisher?: string | null;
  coverImage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function BookDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch book details
  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/books/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch book details');
        }
        
        const data = await response.json();
        setBook(data);
      } catch (error) {
        console.error('Error fetching book:', error);
        toast({
          title: 'Error',
          description: 'Failed to load book details. Please try again.',
        });
        router.push('/dashboard/books');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBook();
    }
  }, [id, router, toast]);

  // Format status
  const formatStatus = (status: BookStatus) => {
    return status
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get status variant for badge
  const getStatusVariant = (status: BookStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'CHECKED_OUT':
        return 'warning';
      case 'RESERVED':
        return 'info';
      case 'LOST':
      case 'DAMAGED':
        return 'destructive';
      case 'PROCESSING':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading || !book) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">Book not found</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/books')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Books
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 px-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
          <p className="text-muted-foreground">
            by {book.author} • {book.publishedYear || 'Unknown year'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={getStatusVariant(book.status)} className="text-sm">
            {formatStatus(book.status)}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/books/${book.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Book
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Book Cover</CardTitle>
            </CardHeader>
            <CardContent>
              {book.coverImage ? (
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md">
                  <img
                    src={book.coverImage}
                    alt={`${book.title} cover`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-[2/3] w-full items-center justify-center rounded-md bg-muted">
                  <span className="text-muted-foreground">No cover image</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">ISBN</p>
                  <p className="font-mono">{book.isbn}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p>{book.category}</p>
                </div>
                {book.edition && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Edition</p>
                    <p>{book.edition}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Language</p>
                  <p>{book.language || 'Not specified'}</p>
                </div>
                {book.pageCount && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Pages</p>
                    <p>{book.pageCount.toLocaleString()}</p>
                  </div>
                )}
                {book.publisher && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Publisher</p>
                    <p>{book.publisher}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Added on</p>
                  <p>{format(new Date(book.createdAt), 'MMM d, yyyy')}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Last updated</p>
                  <p>{format(new Date(book.updatedAt), 'MMM d, yyyy')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {book.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-muted-foreground">
                  {book.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
