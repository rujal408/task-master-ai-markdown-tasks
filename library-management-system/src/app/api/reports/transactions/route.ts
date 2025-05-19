import { prisma } from '@/lib/prisma';
import { BookStatus, TransactionStatus, UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getStartDate } from '@/lib/utils/date-utils';

// Parse query parameters
function parseQueryParams(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  
  return {
    timeframe: searchParams.get('timeframe') || 'month',
    format: searchParams.get('format') || 'json',
    category: searchParams.get('category') || '',
    status: searchParams.get('status') || '',
    userId: searchParams.get('userId') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
  };
}

export async function GET(req: NextRequest) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    
    if (!session?.user || 
        (session.user.role !== UserRole.ADMIN && 
         session.user.role !== UserRole.LIBRARIAN)) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // Parse parameters
    const params = parseQueryParams(req);
    
    // Determine date range
    let startDate = null;
    let endDate = null;

    if (params.dateFrom && params.dateTo) {
      startDate = new Date(params.dateFrom);
      endDate = new Date(params.dateTo);
    } else if (params.timeframe !== 'all') {
      startDate = getStartDate(params.timeframe);
      endDate = new Date();
    }

    // Construct date filters
    const dateFilter = {} as any;
    if (startDate) {
      dateFilter.gte = startDate;
    }
    if (endDate) {
      dateFilter.lte = endDate;
    }

    // Build where clause
    const whereClause = {
      ...(Object.keys(dateFilter).length > 0 ? { transactionDate: dateFilter } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.userId ? { userId: params.userId } : {}),
    } as any;

    // Get transaction statistics
    const transactionCount = await prisma.transaction.count({
      where: whereClause,
    });

    // Get transactions by status
    const statusCounts = await prisma.transaction.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
      where: whereClause,
    });

    // Format status data
    const formattedStatusCounts = statusCounts.map(statusGroup => ({
      status: statusGroup.status,
      count: statusGroup._count.id,
    }));

    // Popular books - most checked out
    const popularBooks = await prisma.book.findMany({
      select: {
        id: true,
        title: true,
        author: true,
        category: true,
        _count: {
          select: {
            transactions: {
              where: {
                status: {
                  in: [
                    TransactionStatus.CHECKED_OUT,
                    TransactionStatus.RETURNED,
                    TransactionStatus.CLAIMED_RETURNED,
                  ],
                },
                ...(Object.keys(dateFilter).length > 0 ? { transactionDate: dateFilter } : {}),
              },
            },
          },
        },
      },
      orderBy: {
        transactions: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    // Format popular books
    const formattedPopularBooks = popularBooks.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      category: book.category,
      checkoutCount: book._count.transactions,
    }));

    // Get active members - most transactions
    const activeMembers = await prisma.user.findMany({
      where: {
        role: UserRole.MEMBER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            transactions: {
              where: Object.keys(dateFilter).length > 0 ? { transactionDate: dateFilter } : {},
            },
          },
        },
      },
      orderBy: {
        transactions: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    // Format active members
    const formattedActiveMembers = activeMembers.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      transactionCount: member._count.transactions,
    }));

    // Get overdue transactions
    const overdueTransactions = await prisma.transaction.findMany({
      where: {
        status: TransactionStatus.CHECKED_OUT,
        dueDate: {
          lt: new Date(),
        },
      },
      select: {
        id: true,
        transactionDate: true,
        dueDate: true,
        book: {
          select: {
            id: true,
            title: true,
            author: true,
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
        dueDate: 'asc',
      },
    });

    // Calculate average checkout duration
    const completedTransactions = await prisma.transaction.findMany({
      where: {
        status: TransactionStatus.RETURNED,
        returnDate: { not: null },
        transactionDate: { not: null },
        ...(Object.keys(dateFilter).length > 0 ? { transactionDate: dateFilter } : {}),
      },
      select: {
        transactionDate: true,
        returnDate: true,
      },
    });

    let averageCheckoutDays = 0;
    if (completedTransactions.length > 0) {
      const totalDays = completedTransactions.reduce((sum, transaction) => {
        if (transaction.returnDate && transaction.transactionDate) {
          const diffTime = Math.abs(
            transaction.returnDate.getTime() - transaction.transactionDate.getTime()
          );
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return sum + diffDays;
        }
        return sum;
      }, 0);
      averageCheckoutDays = totalDays / completedTransactions.length;
    }

    // Get transactions by category (joining with book data)
    const transactionsByCategory = await prisma.transaction.groupBy({
      by: ['bookId'],
      _count: {
        id: true,
      },
      where: whereClause,
    });

    const bookIds = transactionsByCategory.map(t => t.bookId);
    const books = await prisma.book.findMany({
      where: {
        id: {
          in: bookIds,
        },
      },
      select: {
        id: true,
        category: true,
      },
    });

    // Create a map of book IDs to categories
    const bookCategories = new Map();
    books.forEach(book => {
      bookCategories.set(book.id, book.category);
    });

    // Group transactions by category
    const categoryTransactionMap = new Map();
    transactionsByCategory.forEach(transaction => {
      const category = bookCategories.get(transaction.bookId) || 'Uncategorized';
      const currentCount = categoryTransactionMap.get(category) || 0;
      categoryTransactionMap.set(category, currentCount + transaction._count.id);
    });

    // Format category data
    const formattedCategoryData = Array.from(categoryTransactionMap.entries()).map(
      ([category, count]) => ({
        category,
        transactionCount: count,
      })
    );

    // Monthly trend data - transactions per month
    const currentDate = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(currentDate.getMonth() - 5); // Get 6 months (current + 5 previous)

    // Get all transactions in the last 6 months
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        transactionDate: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        id: true,
        transactionDate: true,
        status: true,
      },
    });

    // Group by month
    const monthlyData = Array(6).fill(0).map((_, index) => {
      const month = new Date();
      month.setMonth(currentDate.getMonth() - (5 - index));
      return {
        month: month.toLocaleString('default', { month: 'short', year: 'numeric' }),
        checkouts: 0,
        returns: 0,
        overdue: 0,
      };
    });

    // Fill in the data
    recentTransactions.forEach(transaction => {
      if (transaction.transactionDate) {
        const transactionMonth = transaction.transactionDate.getMonth();
        const transactionYear = transaction.transactionDate.getFullYear();
        
        for (let i = 0; i < 6; i++) {
          const dataPoint = monthlyData[i];
          const dataPointDate = new Date(dataPoint.month + " 1"); // Convert to Date object
          
          if (
            transactionMonth === dataPointDate.getMonth() &&
            transactionYear === dataPointDate.getFullYear()
          ) {
            if (transaction.status === TransactionStatus.CHECKED_OUT) {
              dataPoint.checkouts++;
              
              // Check if overdue
              if (
                transaction.status === TransactionStatus.CHECKED_OUT &&
                new Date() > new Date(transaction.transactionDate)
              ) {
                dataPoint.overdue++;
              }
            } else if (transaction.status === TransactionStatus.RETURNED) {
              dataPoint.returns++;
            }
            break;
          }
        }
      }
    });

    // Format the report data
    const reportData = {
      generatedAt: new Date(),
      timeframe: params.timeframe,
      dateRange: {
        from: startDate,
        to: endDate,
      },
      totalTransactions: transactionCount,
      statusCounts: formattedStatusCounts,
      popularBooks: formattedPopularBooks,
      activeMembers: formattedActiveMembers,
      overdueTransactions: overdueTransactions,
      averageCheckoutDays: parseFloat(averageCheckoutDays.toFixed(1)),
      categoryBreakdown: formattedCategoryData,
      monthlyTrend: monthlyData,
    };

    // Return in requested format
    if (params.format === 'csv') {
      // Convert to CSV format
      const csvHeader = 'Generated Report for Transactions\n' +
                      `Generated At: ${reportData.generatedAt}\n` +
                      `Timeframe: ${reportData.timeframe}\n\n` +
                      'TRANSACTION SUMMARY\n' +
                      `Total Transactions: ${reportData.totalTransactions}\n` +
                      `Average Checkout Duration: ${reportData.averageCheckoutDays} days\n\n` +
                      'TRANSACTION STATUS BREAKDOWN\n' +
                      'Status,Count\n';
      
      const statusRows = reportData.statusCounts
        .map(status => `${status.status},${status.count}`)
        .join('\n');
      
      const popularBooksHeader = '\n\nPOPULAR BOOKS\n' +
                              'Title,Author,Category,Checkout Count\n';
      
      const popularBooksRows = reportData.popularBooks
        .map(book => `"${book.title}","${book.author}",${book.category},${book.checkoutCount}`)
        .join('\n');
      
      const categoryHeader = '\n\nCATEGORY BREAKDOWN\n' +
                          'Category,Transaction Count\n';
      
      const categoryRows = reportData.categoryBreakdown
        .map(cat => `${cat.category},${cat.transactionCount}`)
        .join('\n');
      
      const csv = csvHeader + statusRows + popularBooksHeader + popularBooksRows + categoryHeader + categoryRows;
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="transaction-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Return JSON by default
    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error generating transaction report:', error);
    return NextResponse.json(
      { error: 'Failed to generate transaction report' },
      { status: 500 }
    );
  }
}
