import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { checkPermissions } from '@/lib/auth/rbac/middleware';

// GET handler for borrowings - retrieves all borrowings or filtered by status
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    // Authorization check - verify user has permission to read transactions
    const hasPermission = await checkPermissions(session.user.id, 'TRANSACTION_READ');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const memberId = searchParams.get('memberId');
    const bookId = searchParams.get('bookId');

    // Build filter object
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (memberId) {
      filter.memberId = memberId;
    }
    
    if (bookId) {
      filter.bookId = bookId;
    }

    // Fetch borrowings with filters
    const borrowings = await prisma.borrowing.findMany({
      where: filter,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            coverImage: true,
          },
        },
        member: {
          select: {
            id: true,
            name: true,
            email: true,
            membershipNumber: true,
          },
        },
      },
      orderBy: {
        checkoutDate: 'desc',
      },
    });

    return NextResponse.json(borrowings);
  } catch (error) {
    console.error('Error fetching borrowings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST handler for creating a new borrowing record
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    // Authorization check - verify user has permission to create transactions
    const hasPermission = await checkPermission(session.user.id, 'TRANSACTION_CREATE');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { bookId, memberId, dueDate, notes } = body;

    // Validate required fields
    if (!bookId || !memberId || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: bookId, memberId, dueDate' },
        { status: 400 }
      );
    }

    // Check if book exists and is available
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (book.status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: `Book is not available for checkout. Current status: ${book.status}` },
        { status: 400 }
      );
    }

    // Check if member exists and has active status
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (member.membershipStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Member's membership is not active. Current status: ${member.membershipStatus}` },
        { status: 400 }
      );
    }

    // Begin transaction to create borrowing record and update book status
    const result = await prisma.$transaction(async (tx) => {
      // Create borrowing record
      const borrowing = await tx.borrowing.create({
        data: {
          bookId,
          memberId,
          checkoutDate: new Date(),
          dueDate: new Date(dueDate),
          status: 'ACTIVE',
          notes: notes || null,
          librarian: session.user.name || 'System',
          librarianId: session.user.id,
        },
      });

      // Update book status
      await tx.book.update({
        where: { id: bookId },
        data: { status: 'CHECKED_OUT' },
      });

      // Update member's borrowedBooks count
      await tx.member.update({
        where: { id: memberId },
        data: { borrowedBooks: { increment: 1 } },
      });

      return borrowing;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating borrowing record:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
