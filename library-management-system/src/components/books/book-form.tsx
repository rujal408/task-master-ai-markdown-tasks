'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { BookFormValues, createBookSchema, updateBookSchema } from '@/lib/validations/book';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import { BookStatus } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface BookFormProps {
  initialData?: BookFormValues & { id?: string };
  isEditing?: boolean;
}

export function BookForm({ initialData, isEditing = false }: BookFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const defaultValues: BookFormValues = {
    isbn: initialData?.isbn || '',
    title: initialData?.title || '',
    author: initialData?.author || '',
    category: initialData?.category || '',
    edition: initialData?.edition || '',
    language: initialData?.language || 'English',
    pageCount: initialData?.pageCount,
    publishedYear: initialData?.publishedYear,
    publisher: initialData?.publisher || '',
    description: initialData?.description || '',
    coverImage: initialData?.coverImage || '',
    status: initialData?.status || 'AVAILABLE',
  };

  // Define form values type based on the create schema (which has all required fields)
  type FormValues = {
    isbn: string;
    title: string;
    author: string;
    category: string;
    edition: string;
    language: string;
    pageCount?: number | null;
    publishedYear?: number | null;
    publisher: string;
    description: string;
    coverImage: string;
    status: string; // Using string to match the form input type
  };
  
  // Initialize form with proper types
  const form = useForm<FormValues>({
    resolver: zodResolver(createBookSchema) as any, // Type assertion needed for dynamic schema
    defaultValues: {
      isbn: initialData?.isbn || '',
      title: initialData?.title || '',
      author: initialData?.author || '',
      category: initialData?.category || '',
      edition: initialData?.edition || '',
      language: initialData?.language || 'English',
      pageCount: initialData?.pageCount ?? null,
      publishedYear: initialData?.publishedYear ?? null,
      publisher: initialData?.publisher || '',
      description: initialData?.description || '',
      coverImage: initialData?.coverImage || '',
      status: initialData?.status || 'AVAILABLE',
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  // Handle form submission
  const onSubmit = async (formData: FormValues) => {
    // Create a properly typed data object
    const formValues: FormValues = {
      ...formData,
      pageCount: formData.pageCount ? Number(formData.pageCount) : null,
      publishedYear: formData.publishedYear ? Number(formData.publishedYear) : null,
    };
    
    // Prepare the data to send
    const dataToSend = {
      ...formValues,
      // Ensure pageCount and publishedYear are numbers or undefined
      pageCount: formValues.pageCount ?? undefined,
      publishedYear: formValues.publishedYear ?? undefined,
    };
    try {
      setIsLoading(true);
      const url = isEditing && initialData?.id 
        ? `/api/books/${initialData.id}`
        : '/api/books';
      const method = isEditing ? 'PATCH' : 'POST';



      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || response.statusText || 'Something went wrong');
      }

      const data = await response.json();
      
      toast({
        title: isEditing ? 'Book updated' : 'Book created',
        description: isEditing 
          ? 'The book has been updated successfully.' 
          : 'The book has been added to the library.',
      });

      // Redirect to book details or list
      if (data.id) {
        router.push(`/dashboard/books/${data.id}`);
        router.refresh();
      } else {
        router.push('/dashboard/books');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ISBN */}
          <FormField
            control={form.control}
            name="isbn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ISBN</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., 978-3-16-148410-0"
                    disabled={isLoading || isEditing}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  International Standard Book Number (10 or 13 digits)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Book title"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Author */}
          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Author</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Author name"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Fiction, Science, History"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Edition */}
          <FormField
            control={form.control}
            name="edition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Edition (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., 1st, 2nd, Revised"
                    disabled={isLoading}
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Language */}
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., English, Spanish, French"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Page Count */}
          <FormField
            control={form.control}
            name="pageCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Page Count (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g., 320"
                    disabled={isLoading}
                    value={field.value?.toString() || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value ? parseInt(value, 10) : null);
                    }}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Published Year */}
          <FormField
            control={form.control}
            name="publishedYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Published Year (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1000"
                    max={new Date().getFullYear() + 1}
                    placeholder="e.g., 2023"
                    disabled={isLoading}
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value ? parseInt(value) : null);
                    }}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Publisher */}
          <FormField
            control={form.control}
            name="publisher"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Publisher (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Publisher name"
                    disabled={isLoading}
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={(value: string) => field.onChange(value as BookStatus)}
                  value={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="CHECKED_OUT">Checked Out</SelectItem>
                    <SelectItem value="RESERVED">Reserved</SelectItem>
                    <SelectItem value="LOST">Lost</SelectItem>
                    <SelectItem value="DAMAGED">Damaged</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cover Image */}
          <FormField
            control={form.control}
            name="coverImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover Image URL (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://example.com/book-cover.jpg"
                    disabled={isLoading}
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Book description"
                  className="min-h-[120px]"
                  disabled={isLoading}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && (
              <span className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? 'Update Book' : 'Add Book'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
