import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, BookStatus, TransactionStatus } from '@prisma/client';
import { z } from 'zod';

// Schema for validating report query parameters
const MaintenanceReportQuerySchema = z.object({
  format: z.enum(['json', 'csv']).optional().default('json'),
  timeframe: z.enum(['day', 'week', 'month', 'year', 'all']).optional().default('month'),
  status: z.nativeEnum(BookStatus).optional(),
});

/**
 * GET /api/reports/inventory/maintenance
 * Generates maintenance reports for lost, damaged, and books under maintenance
 * Requires admin or librarian role
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check authorization (admin or librarian only)
    if (
      session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.LIBRARIAN
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';
    const timeframe = url.searchParams.get('timeframe') || 'month';
    const status = url.searchParams.get('status') as BookStatus | null;

    const queryResult = MaintenanceReportQuerySchema.safeParse({
      format,
      timeframe,
      status,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.format() },
        { status: 400 }
      );
    }

    const params = queryResult.data;

    // Get the time range based on the timeframe parameter
    const startDate = getStartDateForTimeframe(params.timeframe);

    // Define maintenance-related statuses
    const maintenanceStatuses = [
      BookStatus.LOST, 
      BookStatus.DAMAGED, 
      BookStatus.UNDER_MAINTENANCE,
      BookStatus.DISCARDED
    ];

    // Use specific status if provided, otherwise use all maintenance statuses
    const statusFilter = params.status 
      ? [params.status] 
      : maintenanceStatuses;

    // Fetch books in maintenance statuses
    const maintenanceBooks = await prisma.book.findMany({
      where: {
        isDeleted: false,
        status: { in: statusFilter },
        ...(startDate ? { updatedAt: { gte: startDate } } : {}),
      },
      include: {
        transactions: {
          where: {
            status: { 
              in: [
                TransactionStatus.LOST, 
                TransactionStatus.DAMAGED,
                TransactionStatus.CLAIMED_RETURNED
              ]
            },
            ...(startDate ? { updatedAt: { gte: startDate } } : {}),
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Calculate statistics by status
    const statusCounts = await prisma.book.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
      where: {
        isDeleted: false,
        status: { in: maintenanceStatuses },
        ...(startDate ? { updatedAt: { gte: startDate } } : {}),
      },
    });

    // Calculate statistics by category
    const categoryBreakdown = await prisma.book.groupBy({
      by: ['category', 'status'],
      _count: {
        id: true,
      },
      where: {
        isDeleted: false,
        status: { in: maintenanceStatuses },
        ...(startDate ? { updatedAt: { gte: startDate } } : {}),
      },
    });

    // Format the category data into a more usable structure
    const categoryData: Record<string, Record<string, number>> = {};
    categoryBreakdown.forEach(item => {
      if (!categoryData[item.category]) {
        categoryData[item.category] = {};
      }
      categoryData[item.category][item.status] = item._count.id;
    });

    // Format the detailed book data
    const formattedBooks = maintenanceBooks.map(book => {
      // Get the last relevant transaction
      const lastTransaction = book.transactions.length > 0 ? book.transactions[0] : null;
      
      return {
        id: book.id,
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        category: book.category,
        status: book.status,
        updatedAt: book.updatedAt,
        lastTransaction: lastTransaction ? {
          id: lastTransaction.id,
          status: lastTransaction.status,
          date: lastTransaction.updatedAt,
          userId: lastTransaction.userId,
          userName: lastTransaction.user?.name || 'Unknown',
        } : null,
      };
    });

    // Build the report response
    const report = {
      generatedAt: new Date().toISOString(),
      timeframe: params.timeframe,
      totalMaintenanceBooks: maintenanceBooks.length,
      statusCounts: statusCounts.map((status) => ({
        status: status.status,
        count: status._count.id,
      })),
      categoryBreakdown: Object.entries(categoryData).map(([category, statuses]) => ({
        category,
        statuses: Object.entries(statuses).map(([status, count]) => ({
          status,
          count,
        })),
        total: Object.values(statuses).reduce((sum, count) => sum + count, 0),
      })),
      books: formattedBooks,
    };

    // Return based on requested format
    if (params.format === 'csv') {
      const csv = generateCsvReport(report);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="maintenance-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Error generating maintenance report:', error);
    return NextResponse.json(
      { error: 'Failed to generate maintenance report', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Get the start date for a specified timeframe
 */
function getStartDateForTimeframe(timeframe: string): Date | null {
  const now = new Date();
  
  switch (timeframe) {
    case 'day':
      const day = new Date(now);
      day.setHours(0, 0, 0, 0);
      return day;
    
    case 'week':
      const week = new Date(now);
      week.setDate(week.getDate() - 7);
      return week;
    
    case 'month':
      const month = new Date(now);
      month.setMonth(month.getMonth() - 1);
      return month;
    
    case 'year':
      const year = new Date(now);
      year.setFullYear(year.getFullYear() - 1);
      return year;
    
    case 'all':
      return null;
    
    default:
      return null;
  }
}

/**
 * Generate a CSV report from the report data
 */
function generateCsvReport(report: any): string {
  // Header for general statistics
  let csv = 'Maintenance Report Summary\n';
  csv += `Generated At,${report.generatedAt}\n`;
  csv += `Timeframe,${report.timeframe}\n`;
  csv += `Total Maintenance Books,${report.totalMaintenanceBooks}\n\n`;

  // Books by status
  csv += 'Books by Status\n';
  csv += 'Status,Count\n';
  report.statusCounts.forEach((statusGroup: any) => {
    csv += `${statusGroup.status},${statusGroup.count}\n`;
  });
  csv += '\n';

  // Category breakdown
  csv += 'Category Breakdown\n';
  csv += 'Category,Status,Count\n';
  report.categoryBreakdown.forEach((category: any) => {
    category.statuses.forEach((statusItem: any) => {
      csv += `${category.category},${statusItem.status},${statusItem.count}\n`;
    });
  });
  csv += '\n';

  // Detailed book list
  csv += 'Detailed Book List\n';
  csv += 'ISBN,Title,Author,Category,Status,Last Updated,Transaction Status,Transaction Date,User\n';
  report.books.forEach((book: any) => {
    csv += `${book.isbn},"${book.title}","${book.author}",${book.category},${book.status},${new Date(book.updatedAt).toISOString()},`;
    
    if (book.lastTransaction) {
      csv += `${book.lastTransaction.status},${new Date(book.lastTransaction.date).toISOString()},"${book.lastTransaction.userName}"\n`;
    } else {
      csv += 'N/A,N/A,N/A\n';
    }
  });

  return csv;
}
