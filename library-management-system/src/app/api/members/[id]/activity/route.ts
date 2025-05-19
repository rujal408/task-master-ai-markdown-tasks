import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Permission } from "@/lib/auth/rbac/types";

// Schema for activity query parameters
const activityQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  type: z.enum(['all', 'transactions', 'reservations']).default('all'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// GET endpoint to retrieve a member's activity history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has appropriate permissions
    const isOwnProfile = session?.user?.id === params.id;
    const canViewAnyUser = session?.user?.permissions?.includes(Permission.USER_READ);
    
    if (!session?.user || (!isOwnProfile && !canViewAnyUser)) {
      return NextResponse.json(
        { error: "You don't have permission to view this activity" },
        { status: 403 }
      );
    }

    const memberId = params.id;
    
    // Check if the member exists
    const member = await prisma.user.findUnique({
      where: { id: memberId },
      select: { id: true },
    });
    
    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const validatedParams = activityQuerySchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 10,
      type: searchParams.get('type') || 'all',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      status: searchParams.get('status') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    });

    const { page, limit, type, sortOrder, status, dateFrom, dateTo } = validatedParams;
    const skip = (page - 1) * limit;
    
    // Prepare date filters if provided
    const dateFilter: any = {};
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo);
    }

    // Define transaction and reservation interfaces
    interface Transaction {
      id: string;
      checkoutDate: Date;
      dueDate: Date;
      returnDate: Date | null;
      status: string;
      fine: number;
      book: {
        id: string;
        title: string;
        author: string;
        isbn: string;
        coverImage: string | null;
      };
      createdAt: Date;
      updatedAt: Date;
    }

    interface Reservation {
      id: string;
      reservationDate: Date;
      expiryDate: Date;
      status: string;
      book: {
        id: string;
        title: string;
        author: string;
        isbn: string;
        coverImage: string | null;
      };
      createdAt: Date;
      updatedAt: Date;
    }

    interface ActivityItem {
      id: string;
      type: 'transaction' | 'reservation';
      date: Date;
      status: string;
      book: {
        id: string;
        title: string;
        author: string;
        isbn: string;
        coverImage: string | null;
      };
      details: {
        dueDate?: Date;
        returnDate?: Date | null;
        fine?: number;
        expiryDate?: Date;
      };
      createdAt: Date;
      updatedAt: Date;
    }

    let transactions: Transaction[] = [];
    let reservations: Reservation[] = [];
    let transactionCount = 0;
    let reservationCount = 0;
    
    // Fetch transactions if requested
    if (type === 'all' || type === 'transactions') {
      // Build transaction where clause
      const transactionWhere: any = { userId: memberId };
      
      if (status) {
        transactionWhere.status = status;
      }
      
      if (Object.keys(dateFilter).length > 0) {
        transactionWhere.checkoutDate = dateFilter;
      }
      
      // Get total count
      transactionCount = await prisma.transaction.count({
        where: transactionWhere,
      });
      
      // Fetch transactions with pagination
      if (type === 'all') {
        // If fetching both types, we need to limit each type
        transactions = await prisma.transaction.findMany({
          where: transactionWhere,
          select: {
            id: true,
            checkoutDate: true,
            dueDate: true,
            returnDate: true,
            status: true,
            fine: true,
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                isbn: true,
                coverImage: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            checkoutDate: sortOrder,
          },
          skip: skip,
          take: Math.floor(limit / 2), // Split the limit between transactions and reservations
        });
      } else if (type === 'transactions') {
        // If only fetching transactions, use the full limit
        transactions = await prisma.transaction.findMany({
          where: transactionWhere,
          select: {
            id: true,
            checkoutDate: true,
            dueDate: true,
            returnDate: true,
            status: true,
            fine: true,
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                isbn: true,
                coverImage: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            checkoutDate: sortOrder,
          },
          skip: skip,
          take: limit,
        });
      }
    }
    
    // Fetch reservations if requested
    if (type === 'all' || type === 'reservations') {
      // Build reservation where clause
      const reservationWhere: any = { userId: memberId };
      
      if (status) {
        reservationWhere.status = status;
      }
      
      if (Object.keys(dateFilter).length > 0) {
        reservationWhere.reservationDate = dateFilter;
      }
      
      // Get total count
      reservationCount = await prisma.reservation.count({
        where: reservationWhere,
      });
      
      // Fetch reservations with pagination
      if (type === 'all') {
        // If fetching both types, we need to limit each type
        reservations = await prisma.reservation.findMany({
          where: reservationWhere,
          select: {
            id: true,
            reservationDate: true,
            expiryDate: true,
            status: true,
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                isbn: true,
                coverImage: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            reservationDate: sortOrder,
          },
          skip: skip,
          take: Math.ceil(limit / 2), // Split the limit between transactions and reservations
        });
      } else if (type === 'reservations') {
        // If only fetching reservations, use the full limit
        reservations = await prisma.reservation.findMany({
          where: reservationWhere,
          select: {
            id: true,
            reservationDate: true,
            expiryDate: true,
            status: true,
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                isbn: true,
                coverImage: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            reservationDate: sortOrder,
          },
          skip: skip,
          take: limit,
        });
      }
    }

    // Prepare activity items in a unified format
    let activityItems: ActivityItem[] = [];
    
    // Transform transactions to activity items
    transactions.forEach(t => {
      activityItems.push({
        id: t.id,
        type: 'transaction',
        date: t.checkoutDate,
        status: t.status,
        book: t.book,
        details: {
          dueDate: t.dueDate,
          returnDate: t.returnDate,
          fine: t.fine,
        },
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      });
    });
    
    // Transform reservations to activity items
    reservations.forEach(r => {
      activityItems.push({
        id: r.id,
        type: 'reservation',
        date: r.reservationDate,
        status: r.status,
        book: r.book,
        details: {
          expiryDate: r.expiryDate,
        },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      });
    });
    
    // Sort activity items by date if showing both types
    if (type === 'all') {
      activityItems.sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        } else {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
      });
      
      // Limit to the requested page size
      activityItems = activityItems.slice(0, limit);
    }
    
    // Calculate total count based on the requested type
    let totalCount = 0;
    if (type === 'all') {
      totalCount = transactionCount + reservationCount;
    } else if (type === 'transactions') {
      totalCount = transactionCount;
    } else if (type === 'reservations') {
      totalCount = reservationCount;
    }
    
    // Return the activity data with pagination info
    return NextResponse.json({
      activity: activityItems,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
        transactionCount,
        reservationCount,
      }
    });
  } catch (error) {
    console.error("Failed to fetch member activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch member activity" },
      { status: 500 }
    );
  }
}
