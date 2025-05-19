import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, BookStatus } from '@prisma/client';
import { z } from 'zod';

// Schema for validating report query parameters
const ReportQuerySchema = z.object({
  format: z.enum(['json', 'csv']).optional().default('json'),
  timeframe: z.enum(['day', 'week', 'month', 'year', 'all']).optional().default('month'),
  category: z.string().optional(),
  status: z.nativeEnum(BookStatus).optional(),
});

type ReportData = {
  category: string;
  statusCounts: {
    status: string;
    count: number;
  }[];
  totalBooks: number;
};

/**
 * GET /api/reports/inventory
 * Generates inventory reports for books
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
    const status = url.searchParams.get('status') as BookStatus | null;

    const queryResult = ReportQuerySchema.safeParse({
      format,
      timeframe,
      category,
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

    // Fetch total collection statistics
    const totalBooks = await prisma.book.count({
      where: {
        isDeleted: false,
        ...(params.category ? { category: params.category } : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(startDate ? { createdAt: { gte: startDate } } : {}),
      } as any,
    });

    // Fetch books by status
    const booksByStatus = await prisma.book.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
      where: {
        isDeleted: false,
        ...(params.category ? { category: params.category } : {}),
        ...(startDate ? { createdAt: { gte: startDate } } : {}),
      } as any,
    });

    // Fetch books by category
    const booksByCategory = await prisma.book.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
      where: {
        isDeleted: false,
        ...(params.status ? { status: params.status } : {}),
        ...(startDate ? { createdAt: { gte: startDate } } : {}),
      } as any,
    });

    // Fetch new acquisitions
    const newAcquisitions = await prisma.book.count({
      where: {
        isDeleted: false,
        createdAt: { gte: startDate },
        ...(params.category ? { category: params.category } : {}),
        ...(params.status ? { status: params.status } : {}),
      } as any,
    });

    // Fetch lost/damaged books
    const lostOrDamagedBooks = await prisma.book.count({
      where: {
        isDeleted: false,
        status: { in: [BookStatus.LOST, BookStatus.DAMAGED] },
        ...(params.category ? { category: params.category } : {}),
        ...(startDate ? { createdAt: { gte: startDate } } : {}),
      } as any,
    });

    // Organize data by category
    const categoryData: ReportData[] = await Promise.all(
      booksByCategory.map(async (categoryGroup) => {
        const statusCounts = await prisma.book.groupBy({
          by: ['status'],
          _count: {
            id: true,
          },
          where: {
            isDeleted: false,
            category: categoryGroup.category,
            ...(startDate ? { createdAt: { gte: startDate } } : {}),
          } as any,
        });

        return {
          category: categoryGroup.category,
          statusCounts: statusCounts.map((s) => ({
            status: s.status,
            count: s._count.id,
          })),
          totalBooks: categoryGroup._count.id,
        };
      })
    );

    // Calculate aggregate statistics
    const mostPopularCategories = [...booksByCategory]
      .sort((a, b) => b._count.id - a._count.id)
      .slice(0, 5);

    // Build the report response
    const report = {
      generatedAt: new Date().toISOString(),
      timeframe: params.timeframe,
      totalBooks,
      booksByStatus: booksByStatus.map((status) => ({
        status: status.status,
        count: status._count.id,
      })),
      booksByCategory: booksByCategory.map((category) => ({
        category: category.category,
        count: category._count.id,
      })),
      newAcquisitions,
      lostOrDamagedBooks,
      mostPopularCategories: mostPopularCategories.map((category) => ({
        category: category.category,
        count: category._count.id,
      })),
      categoryDetails: categoryData,
    };

    // Return based on requested format
    if (params.format === 'csv') {
      const csv = generateCsvReport(report);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="inventory-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Error generating inventory report:', error);
    return NextResponse.json(
      { error: 'Failed to generate inventory report', details: String(error) },
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
  let csv = 'Report Summary\n';
  csv += `Generated At,${report.generatedAt}\n`;
  csv += `Timeframe,${report.timeframe}\n`;
  csv += `Total Books,${report.totalBooks}\n`;
  csv += `New Acquisitions,${report.newAcquisitions}\n`;
  csv += `Lost or Damaged Books,${report.lostOrDamagedBooks}\n\n`;

  // Status breakdown
  csv += 'Books by Status\n';
  csv += 'Status,Count\n';
  report.booksByStatus.forEach((statusGroup: any) => {
    csv += `${statusGroup.status},${statusGroup.count}\n`;
  });
  csv += '\n';

  // Category breakdown
  csv += 'Books by Category\n';
  csv += 'Category,Count\n';
  report.booksByCategory.forEach((categoryGroup: any) => {
    csv += `${categoryGroup.category},${categoryGroup.count}\n`;
  });
  csv += '\n';

  // Popular categories
  csv += 'Most Popular Categories\n';
  csv += 'Category,Count\n';
  report.mostPopularCategories.forEach((category: any) => {
    csv += `${category.category},${category.count}\n`;
  });
  csv += '\n';

  // Detailed category breakdown with status counts
  csv += 'Detailed Category Breakdown\n';
  csv += 'Category,Status,Count\n';
  report.categoryDetails.forEach((category: any) => {
    category.statusCounts.forEach((statusCount: any) => {
      csv += `${category.category},${statusCount.status},${statusCount.count}\n`;
    });
  });

  return csv;
}
