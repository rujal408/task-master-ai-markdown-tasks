import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, TransactionStatus } from '@prisma/client';
import { z } from 'zod';

// Schema for validating report query parameters
const CirculationReportQuerySchema = z.object({
  format: z.enum(['json', 'csv']).optional().default('json'),
  timeframe: z.enum(['day', 'week', 'month', 'year', 'all']).optional().default('month'),
  category: z.string().optional(),
});

/**
 * GET /api/reports/inventory/circulation
 * Generates circulation reports for book transactions
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
    const category = url.searchParams.get('category') || undefined;

    const queryResult = CirculationReportQuerySchema.safeParse({
      format,
      timeframe,
      category,
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

    // Fetch total transactions
    const totalTransactions = await prisma.transaction.count({
      where: {
        ...(startDate ? { checkoutDate: { gte: startDate } } : {}),
        ...(params.category ? { 
          book: {
            category: params.category
          } 
        } : {}),
      },
    });

    // Fetch transactions by status
    const transactionsByStatus = await prisma.transaction.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
      where: {
        ...(startDate ? { checkoutDate: { gte: startDate } } : {}),
        ...(params.category ? { 
          book: {
            category: params.category
          } 
        } : {}),
      },
    });

    // Fetch most checked out books
    const mostCheckedOutBooks = await prisma.transaction.groupBy({
      by: ['bookId'],
      _count: {
        id: true,
      },
      where: {
        ...(startDate ? { checkoutDate: { gte: startDate } } : {}),
        ...(params.category ? { 
          book: {
            category: params.category
          } 
        } : {}),
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Get book details for most checked out books
    const topBooks = await Promise.all(
      mostCheckedOutBooks.map(async (book) => {
        const bookDetails = await prisma.book.findUnique({
          where: { id: book.bookId },
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            category: true,
          },
        });
        return {
          book: bookDetails,
          checkoutCount: book._count.id,
        };
      })
    );
    
    // Fetch overdue transactions
    const overdueTransactions = await prisma.transaction.count({
      where: {
        status: TransactionStatus.OVERDUE,
        ...(startDate ? { checkoutDate: { gte: startDate } } : {}),
        ...(params.category ? { 
          book: {
            category: params.category
          } 
        } : {}),
      },
    });

    // Calculate average checkout duration
    const transactions = await prisma.transaction.findMany({
      where: {
        returnDate: { not: null },
        ...(startDate ? { checkoutDate: { gte: startDate } } : {}),
        ...(params.category ? { 
          book: {
            category: params.category
          } 
        } : {}),
      },
      select: {
        checkoutDate: true,
        returnDate: true,
      },
    });

    let totalDays = 0;
    let completedTransactions = 0;

    transactions.forEach((transaction) => {
      if (transaction.returnDate) {
        const checkoutDate = new Date(transaction.checkoutDate);
        const returnDate = new Date(transaction.returnDate);
        const days = Math.round((returnDate.getTime() - checkoutDate.getTime()) / (1000 * 60 * 60 * 24));
        
        totalDays += days;
        completedTransactions++;
      }
    });

    const averageCheckoutDuration = completedTransactions > 0
      ? Math.round(totalDays / completedTransactions * 10) / 10
      : 0;

    // Fetch transactions by category
    const transactionsByCategory = await prisma.transaction.groupBy({
      by: ['bookId'],
      _count: {
        id: true,
      },
      where: {
        ...(startDate ? { checkoutDate: { gte: startDate } } : {}),
      },
    });

    const categoryCheckouts = await Promise.all(
      transactionsByCategory.map(async (transaction) => {
        const book = await prisma.book.findUnique({
          where: { id: transaction.bookId },
          select: {
            category: true,
          },
        });
        return {
          bookId: transaction.bookId,
          category: book?.category || 'Unknown',
          count: transaction._count.id,
        };
      })
    );

    // Aggregate by category
    const categoryCounts: Record<string, number> = {};
    for (const checkout of categoryCheckouts) {
      categoryCounts[checkout.category] = (categoryCounts[checkout.category] || 0) + checkout.count;
    }

    const categoryBreakdown = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
    })).sort((a, b) => b.count - a.count);

    // Build the report response
    const report = {
      generatedAt: new Date().toISOString(),
      timeframe: params.timeframe,
      totalTransactions,
      transactionsByStatus: transactionsByStatus.map((status) => ({
        status: status.status,
        count: status._count.id,
      })),
      mostCheckedOutBooks: topBooks,
      overdueTransactions,
      averageCheckoutDuration,
      categoryBreakdown,
    };

    // Return based on requested format
    if (params.format === 'csv') {
      const csv = generateCsvReport(report);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="circulation-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Error generating circulation report:', error);
    return NextResponse.json(
      { error: 'Failed to generate circulation report', details: String(error) },
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
  let csv = 'Circulation Report Summary\n';
  csv += `Generated At,${report.generatedAt}\n`;
  csv += `Timeframe,${report.timeframe}\n`;
  csv += `Total Transactions,${report.totalTransactions}\n`;
  csv += `Overdue Transactions,${report.overdueTransactions}\n`;
  csv += `Average Checkout Duration (days),${report.averageCheckoutDuration}\n\n`;

  // Transactions by status
  csv += 'Transactions by Status\n';
  csv += 'Status,Count\n';
  report.transactionsByStatus.forEach((statusGroup: any) => {
    csv += `${statusGroup.status},${statusGroup.count}\n`;
  });
  csv += '\n';

  // Category breakdown
  csv += 'Transactions by Category\n';
  csv += 'Category,Count\n';
  report.categoryBreakdown.forEach((category: any) => {
    csv += `${category.category},${category.count}\n`;
  });
  csv += '\n';

  // Most checked out books
  csv += 'Most Checked Out Books\n';
  csv += 'Title,Author,ISBN,Category,Checkout Count\n';
  report.mostCheckedOutBooks.forEach((item: any) => {
    if (item.book) {
      csv += `"${item.book.title}","${item.book.author}",${item.book.isbn},${item.book.category},${item.checkoutCount}\n`;
    }
  });

  return csv;
}
