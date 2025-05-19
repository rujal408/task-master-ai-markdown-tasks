import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Fetch user's transaction history (limited to most recent 10)
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        bookId: true,
        book: {
          select: {
            title: true,
            author: true,
          }
        },
        checkoutDate: true,
        dueDate: true,
        returnDate: true,
        status: true,
        fine: true,
      },
    });
    
    // Fetch user's reservation history (limited to most recent 10)
    const reservations = await prisma.reservation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        bookId: true,
        book: {
          select: {
            title: true,
            author: true,
          }
        },
        reservationDate: true,
        expiryDate: true,
        status: true,
      },
    });
    
    return NextResponse.json({
      transactions,
      reservations,
    });
  } catch (error) {
    console.error("Failed to fetch user activity history:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity history" },
      { status: 500 }
    );
  }
}
