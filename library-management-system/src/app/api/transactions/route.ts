import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Permission } from "@/lib/auth/rbac/types";
import { BookStatus, TransactionStatus, UserStatus } from "@prisma/client";

// Schema for validating transaction creation (checkout)
const checkoutSchema = z.object({
  bookId: z.string().uuid({
    message: "Invalid book ID format",
  }),
  userId: z.string().uuid({
    message: "Invalid user ID format",
  }),
  dueDate: z.string().refine(
    (value) => {
      const date = new Date(value);
      const today = new Date();
      return !isNaN(date.getTime()) && date > today;
    },
    {
      message: "Due date must be a valid date in the future",
    }
  ),
  notes: z.string().max(500).optional(),
});

// Schema for filtering transactions
const transactionFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.nativeEnum(TransactionStatus).optional(),
  userId: z.string().uuid().optional(),
  bookId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['checkoutDate', 'dueDate', 'returnDate', 'updatedAt']).default('checkoutDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  overdue: z.boolean().optional(),
});

// Helper function to calculate due date (default: 14 days from checkout)
function calculateDueDate(checkoutDate: Date, customDueDate?: string): Date {
  if (customDueDate) {
    const dueDate = new Date(customDueDate);
    if (!isNaN(dueDate.getTime())) {
      return dueDate;
    }
  }
  
  // Default: 14 days from checkout
  const dueDate = new Date(checkoutDate);
  dueDate.setDate(dueDate.getDate() + 14);
  return dueDate;
}

// Helper function to calculate fine for late returns
function calculateFine(dueDate: Date, returnDate: Date): number {
  // If returned before or on due date, no fine
  if (returnDate <= dueDate) {
    return 0;
  }
  
  // Calculate days overdue
  const daysOverdue = Math.ceil(
    (returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Fine calculation: $0.50 per day overdue
  const fineRate = 0.5; // $0.50 per day
  return parseFloat((daysOverdue * fineRate).toFixed(2));
}

// GET endpoint to list transactions with filtering, pagination, and sorting
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has permission to read transactions
    if (!session?.user?.permissions?.includes(Permission.TRANSACTION_READ)) {
      return NextResponse.json(
        { error: "You don't have permission to view transactions" },
        { status: 403 }
      );
    }

    // Parse URL search params for filtering and pagination
    const searchParams = request.nextUrl.searchParams;
    const validatedParams = transactionFilterSchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 10,
      status: searchParams.get('status') || undefined,
      userId: searchParams.get('userId') || undefined,
      bookId: searchParams.get('bookId') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      sortBy: searchParams.get('sortBy') || 'checkoutDate',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      overdue: searchParams.get('overdue') === 'true',
    });

    const { 
      page, 
      limit, 
      status, 
      userId, 
      bookId, 
      dateFrom, 
      dateTo, 
      sortBy, 
      sortOrder,
      overdue 
    } = validatedParams;
    
    const skip = (page - 1) * limit;

    // Build the filter object for prisma query
    const where: any = {};

    // Add status filter if provided
    if (status) {
      where.status = status;
    }

    // Add user filter if provided
    if (userId) {
      where.userId = userId;
    }

    // Add book filter if provided
    if (bookId) {
      where.bookId = bookId;
    }

    // Add date range filter if provided
    if (dateFrom || dateTo) {
      where.checkoutDate = {};
      
      if (dateFrom) {
        where.checkoutDate.gte = new Date(dateFrom);
      }
      
      if (dateTo) {
        where.checkoutDate.lte = new Date(dateTo);
      }
    }

    // Add overdue filter if specified
    if (overdue) {
      const today = new Date();
      where.AND = [
        { status: TransactionStatus.CHECKED_OUT },
        { dueDate: { lt: today } }
      ];
    }

    // Get total count of transactions matching the filter
    const totalCount = await prisma.transaction.count({ where });

    // Get transactions with pagination, filtering, and sorting
    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        id: true,
        checkoutDate: true,
        dueDate: true,
        returnDate: true,
        fine: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            coverImage: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      transactions,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    console.error("Failed to list transactions:", error);
    return NextResponse.json(
      { error: "Failed to list transactions" },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new transaction (checkout a book)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has permission to create transactions
    if (!session?.user?.permissions?.includes(Permission.TRANSACTION_CREATE)) {
      return NextResponse.json(
        { error: "You don't have permission to checkout books" },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // Validate the request data
    const validationResult = checkoutSchema.safeParse(data);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid data", 
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }
    
    // Extract validated data
    const { bookId, userId, dueDate, notes } = validationResult.data;
    
    // Check if the book exists and is available
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });
    
    if (!book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }
    
    if (book.status !== BookStatus.AVAILABLE) {
      return NextResponse.json(
        { error: `Book is not available for checkout. Current status: ${book.status}` },
        { status: 409 }
      );
    }
    
    // Check if the user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    if (user.status !== UserStatus.ACTIVE) {
      return NextResponse.json(
        { error: `User account is not active. Current status: ${user.status}` },
        { status: 409 }
      );
    }
    
    // Check if there are any active reservations for this book
    const activeReservation = await prisma.reservation.findFirst({
      where: {
        bookId,
        status: { in: ['PENDING', 'READY_FOR_PICKUP'] },
        expiryDate: { gt: new Date() },
      },
      orderBy: {
        reservationDate: 'asc',
      },
    });
    
    // If there's an active reservation for someone else, don't allow checkout
    if (activeReservation && activeReservation.userId !== userId) {
      return NextResponse.json(
        { 
          error: "This book is reserved by another user",
          reservationId: activeReservation.id 
        },
        { status: 409 }
      );
    }
    
    // Calculate due date from the provided date string
    const dueDateObj = new Date(dueDate);
    
    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the transaction record
      const transaction = await tx.transaction.create({
        data: {
          bookId,
          userId,
          checkoutDate: new Date(),
          dueDate: dueDateObj,
          status: TransactionStatus.CHECKED_OUT,
          fine: 0,
          ...(notes && { notes }),
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              isbn: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      
      // Update the book status
      await tx.book.update({
        where: { id: bookId },
        data: { status: BookStatus.CHECKED_OUT },
      });
      
      // If there was a reservation for this user, mark it as fulfilled
      if (activeReservation && activeReservation.userId === userId) {
        await tx.reservation.update({
          where: { id: activeReservation.id },
          data: { status: 'FULFILLED' },
        });
      }
      
      return transaction;
    });
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to checkout book:", error);
    return NextResponse.json(
      { error: "Failed to checkout book" },
      { status: 500 }
    );
  }
}
