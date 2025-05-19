'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// @ts-ignore - use-debounce types will be available after installing the package
import { useDebounce } from 'use-debounce';
import { Search, Plus, Loader2, MoreHorizontal, Edit, Trash2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React from 'react';
import { AdvancedSearch, SearchFilters } from './advanced-search';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { useAriaLive, useKeyboardNavigation, ariaLabels, roleAttributes, srOnly } from '@/lib/accessibility';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Simple table components with proper types
interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

const Table = ({ children, ...props }: TableProps) => (
  <div className="relative w-full overflow-auto">
    <table className="w-full caption-bottom text-sm" {...props}>
      {children}
    </table>
  </div>
);

interface TableSectionProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

const TableHeader = ({ children, ...props }: TableSectionProps) => (
  <thead className="[&_tr]:border-b" {...props}>
    {children}
  </thead>
);

const TableBody = ({ children, ...props }: TableSectionProps) => (
  <tbody className="[&_tr:last-child]:border-0" {...props}>
    {children}
  </tbody>
);

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
}

const TableRow = ({ children, ...props }: TableRowProps) => (
  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted" {...props}>
    {children}
  </tr>
);

interface TableCellProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  colSpan?: number;
}

const TableHead = ({ children, ...props }: TableCellProps) => (
  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0" {...props}>
    {children}
  </th>
);

const TableCell = ({ children, ...props }: TableCellProps) => (
  <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0" {...props}>
    {children}
  </td>
);

export type BookStatus = 'AVAILABLE' | 'CHECKED_OUT' | 'RESERVED';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  status: BookStatus;
  coverUrl: string;
  categories: string[];
  tags: string[];
  publicationDate: string;
  dateAdded: string;
  popularity: number;
}

interface BookListProps {
  onEdit?: (book: Book) => void;
  onDelete?: (book: Book) => void;
  onView?: (book: Book) => void;
  className?: string;
}

export function BookList({ onEdit, onDelete, onView, className }: BookListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    text: '',
    categories: [],
    tags: [],
    availability: 'all',
    dateRange: {
      from: null,
      to: null,
    },
    sortBy: 'title',
    sortOrder: 'asc',
  });

  // Initialize accessibility hooks
  const { announce } = useAriaLive('polite');
  const handleKeyDown = useKeyboardNavigation(
    books.map((book) => book.id),
    (id) => {
      const book = books.find((b) => b.id === id);
      if (book) onView?.(book);
    },
    (id) => `book-${id}`
  );

  const fetchBooks = async (filters: SearchFilters) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.text) queryParams.append('search', filters.text);
      if (filters.categories.length) queryParams.append('categories', filters.categories.join(','));
      if (filters.tags.length) queryParams.append('tags', filters.tags.join(','));
      if (filters.availability !== 'all') queryParams.append('status', filters.availability);
      if (filters.dateRange.from) queryParams.append('from', filters.dateRange.from.toISOString());
      if (filters.dateRange.to) queryParams.append('to', filters.dateRange.to.toISOString());
      queryParams.append('sortBy', filters.sortBy);
      queryParams.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/books?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch books');
      
      const data = await response.json();
      setBooks(data);
      announce(`Found ${data.length} books matching your search`);
    } catch (error) {
      toast.error('Failed to fetch books');
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks(filters);
  }, [filters]);

  const handleSearch = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleEdit = (book: Book) => {
    onEdit?.(book);
  };

  const handleDelete = (book: Book) => {
    onDelete?.(book);
  };

  const handleView = (book: Book) => {
    onView?.(book);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Screen reader announcements */}
      <div 
        className={srOnly}
        aria-live="polite"
        aria-atomic="true"
        aria-relevant="text"
      />

      <AdvancedSearch
        onSearch={handleSearch}
        categories={['Fiction', 'Non-Fiction', 'Science', 'History']}
        tags={['Bestseller', 'New Release', 'Award Winner']}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cover</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>ISBN</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : books.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No books found
                </TableCell>
              </TableRow>
            ) : (
              books.map((book) => (
                <TableRow
                  key={book.id}
                  id={`book-${book.id}`}
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, book.id)}
                  onClick={() => handleView(book)}
                  className="cursor-pointer hover:bg-muted/50"
                  role="row"
                  aria-label={`Book: ${book.title} by ${book.author}`}
                >
                  <TableCell>
                    <img
                      src={book.coverUrl}
                      alt={`Cover of ${book.title}`}
                      className="h-16 w-12 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell>{book.title}</TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell>{book.isbn}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        book.status === 'AVAILABLE'
                          ? 'success'
                          : book.status === 'CHECKED_OUT'
                          ? 'destructive'
                          : 'warning'
                      }
                    >
                      {book.status.toLowerCase().replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {book.categories.map((category) => (
                        <Badge key={category} variant="secondary">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {book.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(book);
                        }}
                        aria-label={`Edit ${book.title}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(book);
                        }}
                        aria-label={`Delete ${book.title}`}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
