"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Search,
  PlusCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { useRBAC } from "@/lib/auth/rbac/use-rbac";
import { Permission } from "@/lib/auth/rbac/types";
import { PermissionGuard } from "@/components/auth/role-guard";

// Book type definition
interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  edition?: string;
  language?: string;
  pageCount?: number;
  status: string;
  publishedYear?: number;
  publisher?: string;
  description?: string;
  coverImage?: string;
  tags: string[];
}

// Pagination type definition
interface Pagination {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export default function BooksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();

  // Pagination state
  const [books, setBooks] = useState<Book[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    totalPages: 0,
    totalItems: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");

  // Categories for filter
  const categories = [
    "Fiction",
    "Non-Fiction",
    "Science Fiction",
    "Fantasy",
    "Biography",
    "History",
    "Self-Help",
    "Business",
    "Technology",
    "Science",
    "Reference",
    "Other",
  ];

  // Statuses for filter
  const statuses = [
    "AVAILABLE",
    "CHECKED_OUT",
    "RESERVED",
    "LOST",
    "DAMAGED",
    "UNDER_MAINTENANCE",
    "DISCARDED",
  ];

  // Function to fetch books
  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      
      // Build query string with filters
      const queryParams = new URLSearchParams();
      queryParams.set("page", pagination.page.toString());
      queryParams.set("pageSize", pagination.pageSize.toString());
      
      if (searchQuery) {
        queryParams.set("search", searchQuery);
      }
      
      if (category) {
        queryParams.set("category", category);
      }
      
      if (status) {
        queryParams.set("status", status);
      }
      
      const response = await fetch(`/api/books?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch books");
      }
      
      const data = await response.json();
      setBooks(data.books);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching books:", error);
      toast({
        title: "Error",
        description: "Failed to load books",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch books when filters or pagination changes
  useEffect(() => {
    fetchBooks();
  }, [pagination.page, pagination.pageSize, searchQuery, category, status]);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to first page when search changes
    setPagination({ ...pagination, page: 1 });
  };

  // Handle pagination
  const nextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination({ ...pagination, page: pagination.page + 1 });
    }
  };

  const prevPage = () => {
    if (pagination.page > 1) {
      setPagination({ ...pagination, page: pagination.page - 1 });
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge className="bg-green-500">Available</Badge>;
      case "CHECKED_OUT":
        return <Badge className="bg-blue-500">Checked Out</Badge>;
      case "RESERVED":
        return <Badge className="bg-yellow-500">Reserved</Badge>;
      case "LOST":
        return <Badge className="bg-red-500">Lost</Badge>;
      case "DAMAGED":
        return <Badge className="bg-orange-500">Damaged</Badge>;
      case "UNDER_MAINTENANCE":
        return <Badge className="bg-purple-500">Maintenance</Badge>;
      case "DISCARDED":
        return <Badge className="bg-gray-500">Discarded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Books</h1>
          <p className="text-muted-foreground">
            Browse and manage the library book collection
          </p>
        </div>
        <PermissionGuard permissions={[Permission.BOOK_CREATE]}>
          <Button asChild>
            <Link href="/dashboard/books/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Book
            </Link>
          </Button>
        </PermissionGuard>
      </div>

      <Separator />

      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by title, author, or ISBN..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <div className="flex gap-2">
          <div className="w-[180px]">
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value);
                setPagination({ ...pagination, page: 1 });
              }}
            >
              <SelectTrigger>
                <div className="truncate">
                  <SelectValue placeholder="Category" />
                </div>
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

          <div className="w-[180px]">
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPagination({ ...pagination, page: 1 });
              }}
            >
              <SelectTrigger>
                <div className="truncate">
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                {statuses.map((stat) => (
                  <SelectItem key={stat} value={stat}>
                    {stat.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="icon" onClick={fetchBooks} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 9 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-48 bg-muted animate-pulse" />
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : books.length > 0 ? (
          books.map((book) => (
            <Card key={book.id} className="overflow-hidden">
              <div className="relative h-48 bg-muted">
                {book.coverImage ? (
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <StatusBadge status={book.status} />
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                  {book.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-2">
                  by {book.author}
                </p>
                <div className="flex items-center text-xs text-muted-foreground space-x-2 mb-2">
                  <span>ISBN: {book.isbn}</span>
                  {book.publishedYear && (
                    <>
                      <span>•</span>
                      <span>{book.publishedYear}</span>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {book.tags?.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {book.tags?.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{book.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between">
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/books/${book.id}`}>
                    View Details
                  </Link>
                </Button>
                <PermissionGuard permissions={[Permission.BOOK_UPDATE]}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Filter className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/books/${book.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      {hasPermission(Permission.BOOK_DELETE) && (
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            // Handle delete action
                            if (
                              window.confirm(
                                "Are you sure you want to delete this book?"
                              )
                            ) {
                              // Call delete API and refetch books
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </PermissionGuard>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">No books found</h3>
            <p className="text-muted-foreground mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {books.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium">
              {(pagination.page - 1) * pagination.pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(
                pagination.page * pagination.pageSize,
                pagination.totalItems
              )}
            </span>{" "}
            of <span className="font-medium">{pagination.totalItems}</span> books
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevPage}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={nextPage}
              disabled={pagination.page >= pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
