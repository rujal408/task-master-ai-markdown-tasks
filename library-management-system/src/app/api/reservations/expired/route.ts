import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { Permission } from "@/lib/auth/rbac/types";
import { BookStatus, ReservationStatus } from "@prisma/client";

// GET endpoint to list expired reservations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has permission to read reservations
    if (!session?.user?.permissions?.includes(Permission.RESERVATION_READ)) {
      return NextResponse.json(
        { error: "You don't have permission to view expired reservations" },
        { status: 403 }
      );
    }

    // Calculate current date for comparison
    const now = new Date();
    
    // Find all expired reservations that haven't been marked as expired yet
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        expiryDate: { lt: now },
        status: { in: [ReservationStatus.PENDING, ReservationStatus.READY_FOR_PICKUP] },
      },
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
      orderBy: {
        expiryDate: 'asc',
      },
    });

    return NextResponse.json({
      expiredReservations,
      count: expiredReservations.length,
    });
  } catch (error) {
    console.error("Failed to list expired reservations:", error);
    return NextResponse.json(
      { error: "Failed to list expired reservations" },
      { status: 500 }
    );
  }
}

// POST endpoint to process expired reservations
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has permission to update reservations
    if (!session?.user?.permissions?.includes(Permission.RESERVATION_UPDATE)) {
      return NextResponse.json(
        { error: "You don't have permission to process expired reservations" },
        { status: 403 }
      );
    }

    // Calculate current date for comparison
    const now = new Date();
    
    // Find all reservations that have expired but haven't been marked as expired yet
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        expiryDate: { lt: now },
        status: { in: [ReservationStatus.PENDING, ReservationStatus.READY_FOR_PICKUP] },
      },
      select: {
        id: true,
        bookId: true,
        status: true,
      },
    });
    
    if (expiredReservations.length === 0) {
      return NextResponse.json({
        message: "No expired reservations found",
        processed: 0
      });
    }
    
    // Process each expired reservation
    const results = await Promise.all(
      expiredReservations.map(async (reservation) => {
        try {
          // Start a transaction to ensure consistency
          const result = await prisma.$transaction(async (tx) => {
            // Update reservation status to EXPIRED
            await tx.reservation.update({
              where: { id: reservation.id },
              data: { status: ReservationStatus.EXPIRED },
            });
            
            // If this was a READY_FOR_PICKUP reservation, handle the book status
            if (reservation.status === ReservationStatus.READY_FOR_PICKUP) {
              // Check if book is currently reserved
              const book = await tx.book.findUnique({
                where: { id: reservation.bookId },
                select: { id: true, status: true },
              });
              
              if (book && book.status === BookStatus.RESERVED) {
                // Find next pending reservation for this book
                const nextReservation = await tx.reservation.findFirst({
                  where: {
                    bookId: reservation.bookId,
                    status: ReservationStatus.PENDING,
                    expiryDate: { gt: now }, // Make sure it's not also expired
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
                    where: { id: reservation.bookId },
                    data: { status: BookStatus.AVAILABLE },
                  });
                }
              }
            }
            
            return { id: reservation.id, success: true };
          });
          
          return result;
        } catch (error) {
          console.error(`Error processing reservation ${reservation.id}:`, error);
          return { id: reservation.id, success: false, error };
        }
      })
    );
    
    // Count successful and failed operations
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    return NextResponse.json({
      message: "Processed expired reservations",
      processed: results.length,
      successful,
      failed,
      details: results,
    });
  } catch (error) {
    console.error("Failed to process expired reservations:", error);
    return NextResponse.json(
      { error: "Failed to process expired reservations" },
      { status: 500 }
    );
  }
}
