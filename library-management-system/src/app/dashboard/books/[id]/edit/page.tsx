"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, BookOpen, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { PermissionGuard } from "@/components/auth/role-guard";
import { Permission } from "@/lib/auth/rbac/types";

// Form schema for book editing
const bookFormSchema = z.object({
  isbn: z.string().refine(
    (val) => {
      // Basic ISBN-10 or ISBN-13 validation
      const cleanedIsbn = val.replace(/-/g, "");
      return (
        /^(?:\d{10}|\d{13})$/.test(cleanedIsbn) ||
        /^(?:\d{9}X)$/.test(cleanedIsbn)
      );
    },
    {
      message: "Please enter a valid ISBN-10 or ISBN-13",
    }
  ),
  title: z.string().min(1, { message: "Title is required" }),
  author: z.string().min(1, { message: "Author is required" }),
  category: z.string().min(1, { message: "Category is required" }),
  edition: z.string().optional(),
  language: z.string().optional(),
  pageCount: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d+$/.test(val),
      { message: "Page count must be a positive number" }
    )
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  publishedYear: z
    .string()
    .optional()
    .refine(
      (val) => !val || (/^\d{4}$/.test(val) && parseInt(val, 10) <= new Date().getFullYear()),
      { message: "Please enter a valid year" }
    )
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  publisher: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  status: z.enum([
    "AVAILABLE",
    "CHECKED_OUT",
    "RESERVED",
    "LOST",
    "DAMAGED",
    "UNDER_MAINTENANCE",
    "DISCARDED",
  ]),
});

// Define form type
type BookFormValues = z.infer<typeof bookFormSchema>;

// Type for the book data
interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  edition?: string;
  language?: string;
  pageCount?: number;
  status: "AVAILABLE" | "CHECKED_OUT" | "RESERVED" | "LOST" | "DAMAGED" | "UNDER_MAINTENANCE" | "DISCARDED";
  publishedYear?: number;
  publisher?: string;
  description?: string;
  coverImage?: string;
  tags: string[];
}

export default function EditBookPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [book, setBook] = useState<Book | null>(null);
  const [tagInput, setTagInput] = useState("");

  // Categories for dropdown
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

  // Languages for dropdown
  const languages = [
    "English",
    "Spanish",
    "French",
    "German",
    "Chinese",
    "Japanese",
    "Korean",
    "Russian",
    "Arabic",
    "Hindi",
    "Portuguese",
    "Italian",
    "Dutch",
    "Swedish",
    "Polish",
    "Other",
  ];

  // Statuses for dropdown
  const statuses = [
    "AVAILABLE",
    "CHECKED_OUT",
    "RESERVED",
    "LOST",
    "DAMAGED",
    "UNDER_MAINTENANCE",
    "DISCARDED",
  ];

  // Initialize the form with empty defaults
  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      isbn: "",
      title: "",
      author: "",
      category: "",
      language: "English",
      tags: [],
      status: "AVAILABLE",
    },
  });

  // Fetch book data on component mount
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
        
        // Format the data for the form
        form.reset({
          isbn: data.isbn,
          title: data.title,
          author: data.author,
          category: data.category,
          edition: data.edition || "",
          language: data.language || "English",
          pageCount: data.pageCount ? String(data.pageCount) : "",
          publishedYear: data.publishedYear ? String(data.publishedYear) : "",
          publisher: data.publisher || "",
          description: data.description || "",
          coverImage: data.coverImage || "",
          tags: data.tags || [],
          status: data.status,
        });
      } catch (error) {
        console.error("Error fetching book:", error);
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

  // Function to add a tag
  const addTag = () => {
    if (tagInput.trim() === "") return;
    
    const currentTags = form.getValues("tags") || [];
    
    // Only add if the tag doesn't already exist
    if (!currentTags.includes(tagInput.trim())) {
      form.setValue("tags", [...currentTags, tagInput.trim()]);
    }
    
    setTagInput("");
  };

  // Function to remove a tag
  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  };

  // Form submission handler
  const onSubmit = async (data: BookFormValues) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/books/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update book");
      }
      
      const result = await response.json();
      
      toast({
        title: "Success",
        description: "Book has been updated successfully",
      });
      
      // Redirect to the book details page
      router.push(`/dashboard/books/${result.id}`);
    } catch (error: any) {
      console.error("Error updating book:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update book",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Book Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The book you're trying to edit doesn't exist or has been removed.
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
    <PermissionGuard
      permissions={[Permission.BOOK_UPDATE]}
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-red-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don't have permission to edit books.
          </p>
          <Button asChild>
            <Link href="/dashboard/books">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Books
            </Link>
          </Button>
        </div>
      }
    >
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
              <BreadcrumbLink href={`/dashboard/books/${params.id}`}>
                {book.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Edit</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Book</h1>
            <p className="text-muted-foreground">
              Update the details for &quot;{book.title}&quot;
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/books/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Book Preview</CardTitle>
              <CardDescription>
                Preview how the book will appear in the library
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="relative h-64 w-48 overflow-hidden rounded-md bg-muted mb-4">
                {form.watch("coverImage") ? (
                  <img
                    src={form.watch("coverImage")}
                    alt="Book cover preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "";
                      (e.target as HTMLImageElement).style.display = "none";
                      form.setError("coverImage", {
                        type: "manual",
                        message: "Failed to load image. Please check the URL.",
                      });
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <h3 className="text-xl font-semibold text-center">
                {form.watch("title") || "Book Title"}
              </h3>
              <p className="text-muted-foreground text-center mt-1">
                by {form.watch("author") || "Author Name"}
              </p>
              {form.watch("category") && (
                <Badge variant="outline" className="mt-3">
                  {form.watch("category")}
                </Badge>
              )}
              <div className="flex flex-wrap gap-1 mt-4 justify-center">
                {form.watch("tags")?.map((tag, i) => (
                  <Badge key={i} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="isbn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ISBN</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 9781234567890" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter ISBN-10 or ISBN-13 format
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Book title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="author"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Author</FormLabel>
                        <FormControl>
                          <Input placeholder="Author name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="publishedYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Published Year</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1000"
                            max={new Date().getFullYear()}
                            placeholder="e.g., 2023"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="publisher"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Publisher</FormLabel>
                        <FormControl>
                          <Input placeholder="Publisher name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languages.map((language) => (
                              <SelectItem key={language} value={language}>
                                {language}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="edition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Edition</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., First Edition" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pageCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Page Count</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="e.g., 300"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="coverImage"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Cover Image URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/book-cover.jpg"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter a valid URL for the book cover image
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="sm:col-span-2">
                    <FormLabel>Tags</FormLabel>
                    <div className="flex mb-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add tags (e.g., classics, adventure)"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        className="ml-2"
                        onClick={addTag}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {form.watch("tags")?.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-muted-foreground rounded-full hover:bg-muted hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove tag</span>
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter book description"
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => router.push(`/dashboard/books/${params.id}`)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Updating..." : "Update Book"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
