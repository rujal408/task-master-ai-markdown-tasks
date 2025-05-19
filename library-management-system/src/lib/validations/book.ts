import * as z from 'zod';

export const bookFormSchema = z.object({
  isbn: z.string()
    .min(10, { message: 'ISBN must be at least 10 characters' })
    .max(17, { message: 'ISBN cannot be longer than 17 characters' })
    .regex(
      /^(?:\d{9}[\dXx]|\d{13}|\d{1,5}[- ]\d{1,7}[- ]\d{1,6}[- ][\dXx])$/,
      { message: 'Please enter a valid ISBN' }
    ),
  title: z.string()
    .min(1, { message: 'Title is required' })
    .max(255, { message: 'Title cannot be longer than 255 characters' }),
  author: z.string()
    .min(1, { message: 'Author is required' })
    .max(255, { message: 'Author name cannot be longer than 255 characters' }),
  category: z.string()
    .min(1, { message: 'Category is required' })
    .max(100, { message: 'Category cannot be longer than 100 characters' }),
  edition: z.string()
    .max(50, { message: 'Edition cannot be longer than 50 characters' })
    .optional(),
  language: z.string()
    .max(50, { message: 'Language cannot be longer than 50 characters' })
    .optional()
    .default('English'),
  pageCount: z.number()
    .int({ message: 'Page count must be a whole number' })
    .positive({ message: 'Page count must be a positive number' })
    .optional(),
  publishedYear: z.number()
    .int({ message: 'Year must be a whole number' })
    .min(1000, { message: 'Year must be after 1000' })
    .max(new Date().getFullYear() + 1, { message: 'Year cannot be in the future' })
    .optional(),
  publisher: z.string()
    .max(255, { message: 'Publisher name cannot be longer than 255 characters' })
    .optional(),
  description: z.string()
    .max(2000, { message: 'Description cannot be longer than 2000 characters' })
    .optional(),
  coverImage: z.string().url({ message: 'Please enter a valid URL' }).optional(),
  status: z.enum(['AVAILABLE', 'CHECKED_OUT', 'RESERVED', 'LOST', 'DAMAGED', 'PROCESSING'])
    .default('AVAILABLE'),
});

export type BookFormValues = z.infer<typeof bookFormSchema>;

// Schema for creating a new book (all required fields)
export const createBookSchema = bookFormSchema.required({
  isbn: true,
  title: true,
  author: true,
  category: true,
});

export type CreateBookValues = z.infer<typeof createBookSchema>;

// Schema for updating a book (all fields optional except ID)
export const updateBookSchema = bookFormSchema.partial();
export type UpdateBookValues = z.infer<typeof updateBookSchema>;
