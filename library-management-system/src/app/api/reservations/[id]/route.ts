import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Permission } from "@/lib/auth/rbac/types";
import { BookStatus, ReservationStatus } from "@prisma/client";

// Schema for validating reservation updates
const reservationUpdateSchema = z.object({
  status: z.nativeEnum(ReservationStatus).optional(),
  expiryDate: z.string().refine(
    (value) => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    },
    {
      message: "Expiry date must be a valid date",
    }
  ).optional(),
  notes: z.string().max(500).optional(),
});

// GET endpoint to retrieve a specific reservation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has permission to read reservations
    if (!session?.user?.permissions?.includes(Permission.RESERVATION_READ)) {
      return NextResponse.json(
        { error: "You don't have permission to view reservation details" },
        { status: 403 }
      );
    }

    const reservationId = params.id;

    // Fetch detailed information about the reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            coverImage: true,
            category: true,
            publisher: true,
            publishedYear: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            address: true,
            status: true,
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Calculate queue position information if reservation is pending
    let queuePosition = null;
    let queueLength = null;
    
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
      
      // Calculate queue position (1-based index)
      queuePosition = queue.findIndex(item => item.id === reservation.id) + 1;
      queueLength = queue.length;
    }
    
    // Get book's current transaction status if checked out
    let currentTransaction = null;
    
    if (reservation.book.status === BookStatus.CHECKED_OUT) {
      currentTransaction = await prisma.transaction.findFirst({
        where: {
          bookId: reservation.book.id,
          status: { in: ['CHECKED_OUT', 'OVERDUE'] },
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
        orderBy: {
          checkoutDate: 'desc',
        },
      });
    }

    // Add additional context to the response
    const reservationWithContext = {
      ...reservation,
      queuePosition,
      queueLength,
      currentTransaction,
      // Calculate if reservation is expired
      isExpired: new Date(reservation.expiryDate) < new Date(),
    };

    return NextResponse.json(reservationWithContext);
  } catch (error) {
    console.error("Failed to fetch reservation details:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservation details" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update a specific reservation
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has permission to update reservations
    if (!session?.user?.permissions?.includes(Permission.RESERVATION_UPDATE)) {
      return NextResponse.json(
        { error: "You don't have permission to update reservations" },
        { status: 403 }
      );
    }

    const reservationId = params.id;
    const data = await request.json();
    
    // Validate the request data
    const validationResult = reservationUpdateSchema.safeParse(data);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid data", 
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }
    
    // Check if the reservation exists
    const existingReservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { 
        id: true, 
        status: true, 
        bookId: true,
        userId: true,
      },
    });
    
    if (!existingReservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }
    
    // Extract validated data
    const { status, expiryDate, notes } = validationResult.data;
    const updateData: any = {};
    
    // Only add fields that were provided
    if (status !== undefined) {
      updateData.status = status;
    }
    
    if (expiryDate !== undefined) {
      updateData.expiryDate = new Date(expiryDate);
    }
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    
    // If there are no fields to update, return early
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields provided for update" },
        { status: 400 }
      );
    }
    
    // Check if status change is logical
    if (status && status !== existingReservation.status) {
      // Cannot reactivate a fulfilled, cancelled or expired reservation
      if (
        (existingReservation.status === ReservationStatus.FULFILLED && status === ReservationStatus.PENDING) ||
        (existingReservation.status === ReservationStatus.CANCELLED && status === ReservationStatus.PENDING) ||
        (existingReservation.status === ReservationStatus.EXPIRED && status === ReservationStatus.PENDING)
      ) {
        return NextResponse.json(
          { 
            error: `Cannot change status from ${existingReservation.status} to ${status}. Create a new reservation instead.` 
          },
          { status: 400 }
        );
      }
      
      // If marking as READY_FOR_PICKUP, check if book is actually available
      if (status === ReservationStatus.READY_FOR_PICKUP) {
        const book = await prisma.book.findUnique({
          where: { id: existingReservation.bookId },
          select: { status: true },
        });
        
        if (!book || book.status !== BookStatus.AVAILABLE) {
          return NextResponse.json(
            { 
              error: "Cannot mark reservation as ready for pickup. Book is not available." 
            },
            { status: 409 }
          );
        }
        
        // Update book status to RESERVED when marking reservation as ready for pickup
        await prisma.book.update({
          where: { id: existingReservation.bookId },
          data: { status: BookStatus.RESERVED },
        });
      }
      
      // If marking as FULFILLED, book should be checked out to the reserving user
      if (status === ReservationStatus.FULFILLED) {
        const activeTransaction = await prisma.transaction.findFirst({
          where: {
            bookId: existingReservation.bookId,
            userId: existingReservation.userId,
            status: { in: ['CHECKED_OUT', 'OVERDUE'] },
          },
        });
        
        if (!activeTransaction) {
          return NextResponse.json(
            { 
              error: "Cannot mark reservation as fulfilled. Book has not been checked out to this user." 
            },
            { status: 409 }
          );
        }
      }
      
      // If marking as CANCELLED, update book's status if it was RESERVED for this specific reservation
      if (status === ReservationStatus.CANCELLED && existingReservation.status === ReservationStatus.READY_FOR_PICKUP) {
        // Check if book was reserved for this reservation
        const book = await prisma.book.findUnique({
          where: { id: existingReservation.bookId },
          select: { status: true },
        });
        
        if (book && book.status === BookStatus.RESERVED) {
          // Find next pending reservation for this book
          const nextReservation = await prisma.reservation.findFirst({
            where: {
              bookId: existingReservation.bookId,
              status: ReservationStatus.PENDING,
              id: { not: existingReservation.id },
            },
            orderBy: {
              reservationDate: 'asc',
            },
          });
          
          if (nextReservation) {
            // Keep book as RESERVED and update the next reservation to be ready for pickup
            await prisma.reservation.update({
              where: { id: nextReservation.id },
              data: { status: ReservationStatus.READY_FOR_PICKUP },
            });
          } else {
            // No more pending reservations, make the book available again
            await prisma.book.update({
              where: { id: existingReservation.bookId },
              data: { status: BookStatus.AVAILABLE },
            });
          }
        }
      }
    }
    
    // Update the reservation
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: updateData,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
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
    
    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error("Failed to update reservation:", error);
    return NextResponse.json(
      { error: "Failed to update reservation" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to cancel a reservation
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has appropriate permissions
    const hasDeletePermission = session?.user?.permissions?.includes(Permission.RESERVATION_DELETE);
    const isCurrentUser = false; // Will be set below if applicable
    
    // Fetch the reservation to check ownership and status
    const reservation = await prisma.reservation.findUnique({
      where: { id: params.id },
      include: {
        book: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });
    
    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }
    
    // Check if the current user is the reservation owner
    const isOwner = session?.user?.id === reservation.userId;
    
    // Users can cancel their own pending or ready reservations, admins/librarians can cancel any
    if (!hasDeletePermission && !isOwner) {
      return NextResponse.json(
        { error: "You don't have permission to cancel this reservation" },
        { status: 403 }
      );
    }
    
    // Cannot cancel already fulfilled, cancelled, or expired reservations
    if (
      reservation.status === ReservationStatus.FULFILLED ||
      reservation.status === ReservationStatus.CANCELLED ||
      reservation.status === ReservationStatus.EXPIRED
    ) {
      return NextResponse.json(
        { 
          error: `Cannot cancel a reservation with status: ${reservation.status}` 
        },
        { status: 409 }
      );
    }
    
    // Use transaction to update related entities
    const result = await prisma.$transaction(async (tx) => {
      // Update reservation status to CANCELLED
      const cancelledReservation = await tx.reservation.update({
        where: { id: params.id },
        data: { status: ReservationStatus.CANCELLED },
      });
      
      // If this reservation was ready for pickup (book was reserved for this user)
      if (reservation.status === ReservationStatus.READY_FOR_PICKUP && 
          reservation.book.status === BookStatus.RESERVED) {
        
        // Find next pending reservation for this book
        const nextReservation = await tx.reservation.findFirst({
          where: {
            bookId: reservation.book.id,
            status: ReservationStatus.PENDING,
          },
          orderBy: {
            reservationDate: 'asc',
          },
        });
        
        if (nextReservation) {
          // Update next reservation to be ready for pickup
          await tx.reservation.update({
            where: { id: nextReservation.id },
            data: { status: ReservationStatus.READY_FOR_PICKUP },
          });
        } else {
          // No more pending reservations, make the book available again
          await tx.book.update({
            where: { id: reservation.book.id },
            data: { status: BookStatus.AVAILABLE },
          });
        }
      }
      
      return cancelledReservation;
    });
    
    return NextResponse.json({
      message: "Reservation successfully cancelled",
      id: result.id,
      status: result.status,
    });
  } catch (error) {
    console.error("Failed to cancel reservation:", error);
    return NextResponse.json(
      { error: "Failed to cancel reservation" },
      { status: 500 }
    );
  }
}
