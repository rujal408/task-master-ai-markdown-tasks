import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Permission } from "@/lib/auth/rbac/types";
import { BookStatus, TransactionStatus } from "@prisma/client";

// Schema for validating return requests
const returnSchema = z.object({
  transactionId: z.string().uuid({
    message: "Invalid transaction ID format",
  }),
  condition: z.enum(['GOOD', 'DAMAGED', 'LOST'], {
    errorMap: () => ({ message: "Condition must be one of: GOOD, DAMAGED, LOST" }),
  }),
  notes: z.string().max(500).optional(),
});

// Helper function to calculate fine for late returns
function calculateFine(dueDate: Date, returnDate: Date, condition: string): number {
  // Base fine for condition issues
  let baseFine = 0;
  
  if (condition === 'DAMAGED') {
    baseFine = 15.00; // $15 fee for damaged books
  } else if (condition === 'LOST') {
    baseFine = 50.00; // $50 fee for lost books
  }
  
  // If returned on time and in good condition, no fine
  if (returnDate <= dueDate && condition === 'GOOD') {
    return 0;
  }
  
  // Calculate days overdue (only if applicable)
  let lateFine = 0;
  if (returnDate > dueDate) {
    const daysOverdue = Math.ceil(
      (returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Late fee: $0.50 per day overdue
    const fineRate = 0.5; // $0.50 per day
    lateFine = daysOverdue * fineRate;
  }
  
  // Total fine is base fine plus late fine
  return parseFloat((baseFine + lateFine).toFixed(2));
}

// POST endpoint to process book returns
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has permission to update transactions
    if (!session?.user?.permissions?.includes(Permission.TRANSACTION_UPDATE)) {
      return NextResponse.json(
        { error: "You don't have permission to process book returns" },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // Validate the request data
    const validationResult = returnSchema.safeParse(data);
    
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
    const { transactionId, condition, notes } = validationResult.data;
    
    // Check if the transaction exists and is active
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });
    
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }
    
    if (transaction.status !== TransactionStatus.CHECKED_OUT && 
        transaction.status !== TransactionStatus.OVERDUE) {
      return NextResponse.json(
        { 
          error: `Cannot return book with transaction status: ${transaction.status}. Only CHECKED_OUT or OVERDUE transactions can be returned.` 
        },
        { status: 409 }
      );
    }
    
    const returnDate = new Date();
    const dueDate = new Date(transaction.dueDate);
    
    // Calculate fine based on due date and return condition
    const fine = calculateFine(dueDate, returnDate, condition);
    
    // Determine transaction status based on condition
    let newTransactionStatus: TransactionStatus;
    let newBookStatus: BookStatus;
    
    switch (condition) {
      case 'DAMAGED':
        newTransactionStatus = TransactionStatus.DAMAGED;
        newBookStatus = BookStatus.DAMAGED;
        break;
      case 'LOST':
        newTransactionStatus = TransactionStatus.LOST;
        newBookStatus = BookStatus.LOST;
        break;
      default: // 'GOOD'
        newTransactionStatus = TransactionStatus.RETURNED;
        newBookStatus = BookStatus.AVAILABLE;
    }
    
    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update the transaction
      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: newTransactionStatus,
          returnDate,
          fine,
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
        where: { id: transaction.bookId },
        data: { status: newBookStatus },
      });
      
      // Find next reservation for this book if it's being returned in good condition
      let nextReservation = null;
      
      if (condition === 'GOOD') {
        nextReservation = await tx.reservation.findFirst({
          where: {
            bookId: transaction.bookId,
            status: 'PENDING',
            expiryDate: { gt: new Date() },
          },
          orderBy: {
            reservationDate: 'asc',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
        
        // If there is a pending reservation, update its status
        if (nextReservation) {
          await tx.reservation.update({
            where: { id: nextReservation.id },
            data: { status: 'READY_FOR_PICKUP' },
          });
          
          // Keep the book marked as reserved
          await tx.book.update({
            where: { id: transaction.bookId },
            data: { status: BookStatus.RESERVED },
          });
        }
      }
      
      return {
        transaction: updatedTransaction,
        nextReservation,
        fine,
      };
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to process book return:", error);
    return NextResponse.json(
      { error: "Failed to process book return" },
      { status: 500 }
    );
  }
}
