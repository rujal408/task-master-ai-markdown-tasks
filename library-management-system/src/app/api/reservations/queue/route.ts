import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Permission } from "@/lib/auth/rbac/types";
import { BookStatus, ReservationStatus, TransactionStatus } from "@prisma/client";

// Schema for queue request query parameters
const queueQuerySchema = z.object({
  bookId: z.string().uuid({
    message: "Invalid book ID format",
  }),
});

// GET endpoint to retrieve reservation queue for a specific book
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has permission to read reservations
    if (!session?.user?.permissions?.includes(Permission.RESERVATION_READ)) {
      return NextResponse.json(
        { error: "You don't have permission to view reservation queues" },
        { status: 403 }
      );
    }

    // Parse and validate the bookId parameter
    const searchParams = request.nextUrl.searchParams;
    const bookId = searchParams.get('bookId');
    
    if (!bookId) {
      return NextResponse.json(
        { error: "Missing required parameter: bookId" },
        { status: 400 }
      );
    }
    
    try {
      queueQuerySchema.parse({ bookId });
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid bookId format" },
        { status: 400 }
      );
    }
    
    // Get the book details first to verify it exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        title: true,
        author: true,
        isbn: true,
        status: true,
      },
    });
    
    if (!book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }
    
    // Get all active reservations for this book, ordered by reservation date
    const reservations = await prisma.reservation.findMany({
      where: {
        bookId,
        status: { in: [ReservationStatus.PENDING, ReservationStatus.READY_FOR_PICKUP] },
      },
      select: {
        id: true,
        status: true,
        reservationDate: true,
        expiryDate: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        reservationDate: 'asc',
      },
    });
    
    // Get current transaction information if the book is checked out
    let currentTransaction = null;
    
    if (book.status === BookStatus.CHECKED_OUT) {
      currentTransaction = await prisma.transaction.findFirst({
        where: {
          bookId,
          status: { in: [TransactionStatus.CHECKED_OUT, TransactionStatus.OVERDUE] },
        },
        select: {
          id: true,
          checkoutDate: true,
          dueDate: true,
          status: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }
    
    // Calculate estimated wait times for each position in the queue
    const reservationsWithWaitTime = reservations.map((reservation, index) => {
      // Base wait time calculations:
      // - If position 1 and book is available: 0 days
      // - If position 1 and book is checked out: days until due date + 1 day processing
      // - For each position after: add 7 days (average checkout duration)
      
      let estimatedWaitDays = 0;
      
      if (index === 0 && reservation.status === ReservationStatus.READY_FOR_PICKUP) {
        estimatedWaitDays = 0; // Ready for pickup
      } else if (index === 0 && currentTransaction) {
        // Calculate days until the current checkout is due
        const today = new Date();
        const dueDate = new Date(currentTransaction.dueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // If already overdue, estimate 3 days; otherwise use days until due + 1 day processing
        estimatedWaitDays = daysUntilDue < 0 ? 3 : daysUntilDue + 1;
      } else if (index === 0 && book.status === 'AVAILABLE') {
        estimatedWaitDays = 0; // Book is available
      } else {
        // For subsequent positions, add average checkout duration of 14 days per position
        // Calculate based on position and current book status
        const baseWaitDays = currentTransaction ? 
          Math.max(0, Math.ceil((new Date(currentTransaction.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 
          0;
          
        estimatedWaitDays = baseWaitDays + (index * 14);
      }
      
      return {
        ...reservation,
        position: index + 1,
        estimatedWaitDays,
      };
    });
    
    return NextResponse.json({
      book,
      currentTransaction,
      queueLength: reservations.length,
      reservationQueue: reservationsWithWaitTime,
    });
  } catch (error) {
    console.error("Failed to retrieve reservation queue:", error);
    return NextResponse.json(
      { error: "Failed to retrieve reservation queue" },
      { status: 500 }
    );
  }
}
