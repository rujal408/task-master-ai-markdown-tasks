import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Permission } from "@/lib/auth/rbac/types";
import { TransactionStatus } from "@prisma/client";

// Schema for filtering overdue transactions
const overdueFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['dueDate', 'checkoutDate', 'updatedAt']).default('dueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'), // Default to ascending to show oldest overdue first
  userId: z.string().uuid().optional(),
  daysOverdue: z.coerce.number().int().optional(), // Filter by minimum days overdue
});

// GET endpoint to list all overdue transactions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has permission to read transactions
    if (!session?.user?.permissions?.includes(Permission.TRANSACTION_READ)) {
      return NextResponse.json(
        { error: "You don't have permission to view overdue transactions" },
        { status: 403 }
      );
    }

    // Parse URL search params for filtering and pagination
    const searchParams = request.nextUrl.searchParams;
    const validatedParams = overdueFilterSchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 10,
      sortBy: searchParams.get('sortBy') || 'dueDate',
      sortOrder: searchParams.get('sortOrder') || 'asc',
      userId: searchParams.get('userId') || undefined,
      daysOverdue: searchParams.get('daysOverdue') || undefined,
    });

    const { page, limit, sortBy, sortOrder, userId, daysOverdue } = validatedParams;
    const skip = (page - 1) * limit;

    // Calculate the date threshold for overdue items
    const today = new Date();
    let overdueDate = new Date(today);
    
    // If daysOverdue filter is specified, adjust the threshold
    if (daysOverdue !== undefined) {
      overdueDate.setDate(today.getDate() - daysOverdue);
    }
    
    // Build the filter object for prisma query
    const where: any = {
      status: TransactionStatus.CHECKED_OUT,
      dueDate: { lt: today } // Due date is before today
    };
    
    // Add user filter if provided
    if (userId) {
      where.userId = userId;
    }
    
    // If daysOverdue is provided, ensure due date is before the calculated threshold
    if (daysOverdue !== undefined) {
      where.dueDate.lt = overdueDate;
    }

    // Get total count of overdue transactions matching the filter
    const totalCount = await prisma.transaction.count({ where });

    // Get overdue transactions with pagination, filtering, and sorting
    const overdueTransactions = await prisma.transaction.findMany({
      where,
      select: {
        id: true,
        checkoutDate: true,
        dueDate: true,
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
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Calculate days overdue for each transaction
    const transactionsWithOverdueDays = overdueTransactions.map(transaction => {
      const dueDate = new Date(transaction.dueDate);
      const diffTime = today.getTime() - dueDate.getTime();
      const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Calculate estimated fine
      const fineRate = 0.5; // $0.50 per day
      const estimatedFine = parseFloat((daysOverdue * fineRate).toFixed(2));
      
      return {
        ...transaction,
        daysOverdue,
        estimatedFine,
      };
    });

    // Update status of overdue transactions if they haven't been marked as OVERDUE yet
    // This is done asynchronously to not block the response
    Promise.all(
      overdueTransactions
        .filter(t => t.status === TransactionStatus.CHECKED_OUT)
        .map(t => 
          prisma.transaction.update({
            where: { id: t.id },
            data: { status: TransactionStatus.OVERDUE }
          })
        )
    ).catch(err => console.error("Error updating overdue transaction statuses:", err));

    return NextResponse.json({
      overdueTransactions: transactionsWithOverdueDays,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    console.error("Failed to list overdue transactions:", error);
    return NextResponse.json(
      { error: "Failed to list overdue transactions" },
      { status: 500 }
    );
  }
}

// POST endpoint to mark transactions as overdue
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has permission to update transactions
    if (!session?.user?.permissions?.includes(Permission.TRANSACTION_UPDATE)) {
      return NextResponse.json(
        { error: "You don't have permission to update transaction statuses" },
        { status: 403 }
      );
    }

    // Find all transactions that are checked out but past their due date
    const today = new Date();
    
    const overdueTransactions = await prisma.transaction.findMany({
      where: {
        status: TransactionStatus.CHECKED_OUT,
        dueDate: { lt: today }
      },
      select: {
        id: true,
        dueDate: true,
        bookId: true,
        userId: true,
      }
    });
    
    if (overdueTransactions.length === 0) {
      return NextResponse.json({
        message: "No overdue transactions found",
        updatedCount: 0
      });
    }
    
    // Update all overdue transactions' status
    const updateResult = await prisma.transaction.updateMany({
      where: {
        id: { in: overdueTransactions.map(t => t.id) }
      },
      data: {
        status: TransactionStatus.OVERDUE
      }
    });
    
    return NextResponse.json({
      message: "Successfully updated overdue transaction statuses",
      updatedCount: updateResult.count,
      totalOverdue: overdueTransactions.length
    });
  } catch (error) {
    console.error("Failed to update overdue transactions:", error);
    return NextResponse.json(
      { error: "Failed to update overdue transactions" },
      { status: 500 }
    );
  }
}
