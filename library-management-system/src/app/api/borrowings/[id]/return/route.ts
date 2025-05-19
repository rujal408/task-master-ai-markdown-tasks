import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { checkPermission } from '@/lib/auth/rbac/middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    // Authorization check - verify user has permission to update transactions
    const hasPermission = await checkPermission(session.user.id, 'TRANSACTION_UPDATE');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const borrowingId = params.id;

    // Check if borrowing exists
    const borrowing = await prisma.borrowing.findUnique({
      where: { id: borrowingId },
      include: {
        book: true,
        member: true,
      },
    });

    if (!borrowing) {
      return NextResponse.json({ error: 'Borrowing record not found' }, { status: 404 });
    }

    if (borrowing.status === 'RETURNED') {
      return NextResponse.json({ error: 'Book has already been returned' }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { condition, fineAmount, fineReason, isPaid, notes } = body;

    // Begin transaction to update borrowing record and book status
    const result = await prisma.$transaction(async (tx) => {
      // Update borrowing record
      const updatedBorrowing = await tx.borrowing.update({
        where: { id: borrowingId },
        data: {
          status: 'RETURNED',
          returnDate: new Date(),
          returnCondition: condition,
          fineAmount: fineAmount || null,
          fineReason: fineReason || null,
          finePaid: isPaid || false,
          notes: notes || borrowing.notes,
          returnLibrarian: session.user.name || 'System',
          returnLibrarianId: session.user.id,
        },
      });

      // Update book status based on return condition
      const bookStatus = condition === 'GOOD' ? 'AVAILABLE' : 
                         condition === 'DAMAGED' ? 'DAMAGED' : 'LOST';
      
      await tx.book.update({
        where: { id: borrowing.bookId },
        data: { status: bookStatus },
      });

      // Update member's borrowedBooks count
      await tx.member.update({
        where: { id: borrowing.memberId },
        data: { borrowedBooks: { decrement: 1 } },
      });

      return updatedBorrowing;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing book return:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
