import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// DELETE endpoint to permanently delete a user account
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Delete all user-related data
    // This should be done in a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete any password reset tokens
      await tx.passwordResetToken.deleteMany({
        where: { userId },
      });
      
      // Delete notification preferences (if applicable in your schema)
      // await tx.userNotificationPreference.deleteMany({
      //   where: { userId },
      // });
      
      // Delete user's transactions
      await tx.transaction.deleteMany({
        where: { userId },
      });
      
      // Delete user's reservations
      await tx.reservation.deleteMany({
        where: { userId },
      });
      
      // Finally, delete the user
      await tx.user.delete({
        where: { id: userId },
      });
    });
    
    return NextResponse.json(
      { message: "Account deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
