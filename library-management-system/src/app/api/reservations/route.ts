import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Permission } from "@/lib/auth/rbac/types";
import { BookStatus, ReservationStatus, TransactionStatus } from "@prisma/client";

// Schema for validating reservation creation
const reservationCreateSchema = z.object({
  bookId: z.string().uuid({
    message: "Invalid book ID format",
  }),
  userId: z.string().uuid({
    message: "Invalid user ID format",
  }),
  notes: z.string().max(500).optional(),
});

// Schema for filtering reservations
const reservationFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.nativeEnum(ReservationStatus).optional(),
  userId: z.string().uuid().optional(),
  bookId: z.string().uuid().optional(),
  sortBy: z.enum(['reservationDate', 'expiryDate', 'updatedAt']).default('reservationDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Helper function to calculate expiry date (default: 7 days from reservation)
function calculateExpiryDate(reservationDate: Date): Date {
  const expiryDate = new Date(reservationDate);
  expiryDate.setDate(expiryDate.getDate() + 7);
  return expiryDate;
}

// GET endpoint to list reservations with filtering, pagination, and sorting
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has permission to read reservations
    if (!session?.user?.permissions?.includes(Permission.RESERVATION_READ)) {
      return NextResponse.json(
        { error: "You don't have permission to view reservations" },
        { status: 403 }
      );
    }

    // Parse URL search params for filtering and pagination
    const searchParams = request.nextUrl.searchParams;
    const validatedParams = reservationFilterSchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 10,
      status: searchParams.get('status') || undefined,
      userId: searchParams.get('userId') || undefined,
      bookId: searchParams.get('bookId') || undefined,
      sortBy: searchParams.get('sortBy') || 'reservationDate',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    const { page, limit, status, userId, bookId, sortBy, sortOrder } = validatedParams;
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

    // Get total count of reservations matching the filter
    const totalCount = await prisma.reservation.count({ where });

    // Get reservations with pagination, filtering, and sorting
    const reservations = await prisma.reservation.findMany({
      where,
      select: {
        id: true,
        reservationDate: true,
        expiryDate: true,
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

    // Add queue position information to each reservation
    const reservationsWithPosition = await Promise.all(
      reservations.map(async (reservation) => {
        // For pending reservations, calculate queue position
        let queuePosition = null;
        if (reservation.status === ReservationStatus.PENDING) {
          // Get all pending reservations for this book, ordered by reservation date
          const queue = await prisma.reservation.findMany({
            where: {
              bookId: reservation.book.id,
              status: ReservationStatus.PENDING,
            },
            orderBy: {
              reservationDate: 'asc',
            },
            select: {
              id: true,
            },
          });
          
          // Find position in queue (1-based index)
          queuePosition = queue.findIndex(item => item.id === reservation.id) + 1;
        }
        
        return {
          ...reservation,
          queuePosition,
        };
      })
    );

    return NextResponse.json({
      reservations: reservationsWithPosition,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    console.error("Failed to list reservations:", error);
    return NextResponse.json(
      { error: "Failed to list reservations" },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new reservation
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has permission to create reservations
    if (!session?.user?.permissions?.includes(Permission.RESERVATION_CREATE)) {
      return NextResponse.json(
        { error: "You don't have permission to create reservations" },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // Validate the request data
    const validationResult = reservationCreateSchema.safeParse(data);
    
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
    const { bookId, userId, notes } = validationResult.data;
    
    // Check if the book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });
    
    if (!book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }
    
    // Cannot reserve books that are already available
    if (book.status === BookStatus.AVAILABLE) {
      return NextResponse.json(
        { 
          error: "This book is currently available. No need to reserve it.",
          bookId: book.id,
          status: book.status
        },
        { status: 409 }
      );
    }
    
    // Check if book is in a reservable state
    if (![BookStatus.CHECKED_OUT, BookStatus.RESERVED].includes(book.status)) {
      return NextResponse.json(
        { 
          error: `Book cannot be reserved. Current status: ${book.status}`,
          bookId: book.id,
          status: book.status
        },
        { status: 409 }
      );
    }
    
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if this user already has an active reservation for this book
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        bookId,
        userId,
        status: { in: [ReservationStatus.PENDING, ReservationStatus.READY_FOR_PICKUP] },
      },
    });
    
    if (existingReservation) {
      return NextResponse.json(
        { 
          error: "You already have an active reservation for this book",
          reservationId: existingReservation.id
        },
        { status: 409 }
      );
    }
    
    // Check if this user has already borrowed this book
    const activeTransaction = await prisma.transaction.findFirst({
      where: {
        bookId,
        userId,
        status: { in: [TransactionStatus.CHECKED_OUT, TransactionStatus.OVERDUE] },
      },
    });
    
    if (activeTransaction) {
      return NextResponse.json(
        { 
          error: "You already have this book checked out",
          transactionId: activeTransaction.id
        },
        { status: 409 }
      );
    }
    
    // Calculate the reservation and expiry dates
    const reservationDate = new Date();
    const expiryDate = calculateExpiryDate(reservationDate);
    
    // Use transaction to ensure data consistency
    const newReservation = await prisma.reservation.create({
      data: {
        bookId,
        userId,
        reservationDate,
        expiryDate,
        status: ReservationStatus.PENDING,
        ...(notes && { notes }),
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            status: true,
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
    
    return NextResponse.json(newReservation, { status: 201 });
  } catch (error) {
    console.error("Failed to create reservation:", error);
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}
