import * as z from 'zod';

// Validation schema for creating a new borrowing/checkout
export const borrowingFormSchema = z.object({
  bookId: z.string().min(1, { message: 'Book is required' }),
  memberId: z.string().min(1, { message: 'Member is required' }),
  dueDate: z.string().min(1, { message: 'Due date is required' }).refine(
    (date) => new Date(date) > new Date(),
    { message: 'Due date must be in the future' }
  ),
  notes: z.string().optional(),
});

export type BorrowingFormValues = z.infer<typeof borrowingFormSchema>;

// Validation schema for returning a book
export const returnFormSchema = z.object({
  borrowingId: z.string().min(1, { message: 'Borrowing ID is required' }),
  returnDate: z.string().default(() => new Date().toISOString().split('T')[0]),
  condition: z.enum(['GOOD', 'DAMAGED', 'LOST'], {
    required_error: 'Book condition is required',
  }),
  fineAmount: z.number().min(0).optional(),
  fineReason: z.string().optional(),
  isPaid: z.boolean().default(false),
  notes: z.string().optional(),
});

export type ReturnFormValues = z.infer<typeof returnFormSchema>;

// For transaction search and filtering
export const transactionFilterSchema = z.object({
  searchTerm: z.string().optional(),
  status: z.enum(['ACTIVE', 'RETURNED', 'OVERDUE', 'LOST', 'ALL']).default('ALL'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortField: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
});

export type TransactionFilterValues = z.infer<typeof transactionFilterSchema>;
