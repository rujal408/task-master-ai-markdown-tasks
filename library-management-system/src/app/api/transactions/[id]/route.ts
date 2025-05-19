import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Permission } from "@/lib/auth/rbac/types";
import { TransactionStatus } from "@prisma/client";

// Schema for validating transaction updates
const transactionUpdateSchema = z.object({
  status: z.nativeEnum(TransactionStatus).optional(),
  dueDate: z.string().refine(
    (value) => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    },
    {
      message: "Due date must be a valid date",
    }
  ).optional(),
  notes: z.string().max(500).optional(),
});

// GET endpoint to retrieve a specific transaction
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has permission to read transactions
    if (!session?.user?.permissions?.includes(Permission.TRANSACTION_READ)) {
      return NextResponse.json(
        { error: "You don't have permission to view transaction details" },
        { status: 403 }
      );
    }

    const transactionId = params.id;

    // Fetch detailed information about the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
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

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Calculate days until due (or overdue days) for active transactions
    let daysRemaining = null;
    let isOverdue = false;
    
    if (transaction.status === TransactionStatus.CHECKED_OUT) {
      const today = new Date();
      const dueDate = new Date(transaction.dueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      daysRemaining = diffDays;
      isOverdue = diffDays < 0;
    }

    // Add additional context to the response
    const transactionWithContext = {
      ...transaction,
      daysRemaining,
      isOverdue,
    };

    return NextResponse.json(transactionWithContext);
  } catch (error) {
    console.error("Failed to fetch transaction details:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction details" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update a specific transaction
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has permission to update transactions
    if (!session?.user?.permissions?.includes(Permission.TRANSACTION_UPDATE)) {
      return NextResponse.json(
        { error: "You don't have permission to update transactions" },
        { status: 403 }
      );
    }

    const transactionId = params.id;
    const data = await request.json();
    
    // Validate the request data
    const validationResult = transactionUpdateSchema.safeParse(data);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid data", 
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }
    
    // Check if the transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { id: true, status: true, bookId: true },
    });
    
    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }
    
    // Extract validated data
    const { status, dueDate, notes } = validationResult.data;
    const updateData: any = {};
    
    // Only add fields that were provided
    if (status !== undefined) {
      updateData.status = status;
    }
    
    if (dueDate !== undefined) {
      updateData.dueDate = new Date(dueDate);
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
    if (status && status !== existingTransaction.status) {
      if (
        (existingTransaction.status === TransactionStatus.RETURNED && status === TransactionStatus.CHECKED_OUT) ||
        (existingTransaction.status === TransactionStatus.LOST && status === TransactionStatus.CHECKED_OUT) ||
        (existingTransaction.status === TransactionStatus.DAMAGED && status === TransactionStatus.CHECKED_OUT)
      ) {
        return NextResponse.json(
          { 
            error: `Cannot change status from ${existingTransaction.status} to ${status}. Create a new transaction instead.` 
          },
          { status: 400 }
        );
      }
      
      // If status is being changed to RETURNED, add returnDate
      if (status === TransactionStatus.RETURNED) {
        updateData.returnDate = new Date();
      }
    }
    
    // Update the transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
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
    
    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error("Failed to update transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

// DELETE endpoint for transaction is not implemented
// Instead, transactions should be marked with an appropriate status
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { 
      error: "DELETE operation not supported for transactions. Use PATCH to update status instead." 
    },
    { status: 405 }
  );
}
