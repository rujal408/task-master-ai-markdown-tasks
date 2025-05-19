"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Edit,
  Trash2,
  Calendar,
  Languages,
  BookCopy,
  Tag,
  BarChart4,
  User,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/use-toast";
import { PermissionGuard } from "@/components/auth/role-guard";
import { Permission } from "@/lib/auth/rbac/types";

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

export default function BookDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch book details
  useEffect(() => {
    const fetchBook = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/books/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            toast({
              title: "Not Found",
              description: "The requested book could not be found",
              variant: "destructive",
            });
            router.push("/dashboard/books");
            return;
          }
          
          throw new Error("Failed to fetch book details");
        }
        
        const data = await response.json();
        setBook(data);
      } catch (error) {
        console.error("Error fetching book details:", error);
        toast({
          title: "Error",
          description: "Failed to load book details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [params.id, router, toast]);

  // Handle book deletion
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this book?")) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/books/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete book");
      }

      toast({
        title: "Success",
        description: "Book has been deleted successfully",
      });
      router.push("/dashboard/books");
    } catch (error) {
      console.error("Error deleting book:", error);
      toast({
        title: "Error",
        description: "Failed to delete the book",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Book Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The book you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/dashboard/books">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Books
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/books">Books</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{book.title}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href="/dashboard/books">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Books
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <PermissionGuard permissions={[Permission.BOOK_UPDATE]}>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/books/${book.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </PermissionGuard>

          <PermissionGuard permissions={[Permission.BOOK_DELETE]}>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Book Cover Card */}
        <Card className="md:col-span-1">
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-t-lg bg-muted">
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={book.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <BookOpen className="h-20 w-20 text-muted-foreground" />
              </div>
            )}
          </div>
          <CardContent className="pt-6">
            <div className="mb-4">
              <StatusBadge status={book.status} />
            </div>
            <h2 className="text-2xl font-bold">{book.title}</h2>
            <p className="text-muted-foreground">by {book.author}</p>
            
            <Separator className="my-4" />
            
            <div className="space-y-3">
              <div className="flex items-start">
                <Bookmark className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">ISBN</h3>
                  <p className="text-muted-foreground">{book.isbn}</p>
                </div>
              </div>
              
              {book.category && (
                <div className="flex items-start">
                  <BookCopy className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">Category</h3>
                    <p className="text-muted-foreground">{book.category}</p>
                  </div>
                </div>
              )}
              
              {book.publishedYear && (
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">Published</h3>
                    <p className="text-muted-foreground">
                      {book.publishedYear}{book.publisher && ` by ${book.publisher}`}
                    </p>
                  </div>
                </div>
              )}
              
              {book.language && (
                <div className="flex items-start">
                  <Languages className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">Language</h3>
                    <p className="text-muted-foreground">{book.language}</p>
                  </div>
                </div>
              )}
              
              {book.edition && (
                <div className="flex items-start">
                  <BarChart4 className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">Edition</h3>
                    <p className="text-muted-foreground">{book.edition}</p>
                  </div>
                </div>
              )}
              
              {book.pageCount && (
                <div className="flex items-start">
                  <User className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">Page Count</h3>
                    <p className="text-muted-foreground">{book.pageCount} pages</p>
                  </div>
                </div>
              )}
              
              {book.tags && book.tags.length > 0 && (
                <div className="flex items-start">
                  <Tag className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">Tags</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {book.tags.map((tag, i) => (
                        <Badge key={i} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Book Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Book Details</CardTitle>
            <CardDescription>Comprehensive information about this book</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {book.description ? (
              <div>
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {book.description}
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p className="text-muted-foreground italic">
                  No description available
                </p>
              </div>
            )}

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-4">Loan History</h3>
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Loan history will be displayed here
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-4">Current Reservations</h3>
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No active reservations for this book
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 items-stretch sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
            <PermissionGuard permissions={[Permission.TRANSACTION_CREATE]}>
              <Button className="flex-1">Check Out Book</Button>
            </PermissionGuard>
            <PermissionGuard permissions={[Permission.RESERVATION_CREATE]}>
              <Button variant="outline" className="flex-1">Reserve Book</Button>
            </PermissionGuard>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
