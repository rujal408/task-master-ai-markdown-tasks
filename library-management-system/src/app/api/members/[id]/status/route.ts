import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Permission } from "@/lib/auth/rbac/types";
import { UserStatus } from "@prisma/client";

// Schema for status update
const statusUpdateSchema = z.object({
  status: z.nativeEnum(UserStatus),
  reason: z.string().max(500).optional(),
});

// PATCH endpoint to update a member's status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has permission to update users
    if (!session?.user?.permissions?.includes(Permission.USER_UPDATE)) {
      return NextResponse.json(
        { error: "You don't have permission to update member status" },
        { status: 403 }
      );
    }

    const memberId = params.id;
    const data = await request.json();
    
    // Validate the request data
    const validationResult = statusUpdateSchema.safeParse(data);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid data", 
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }
    
    // Extract validated data
    const { status, reason } = validationResult.data;
    
    // Check if the member exists
    const existingMember = await prisma.user.findUnique({
      where: { id: memberId },
      select: { 
        id: true, 
        status: true,
        // Check for active transactions if suspending or deactivating
        transactions: status === UserStatus.INACTIVE || status === UserStatus.SUSPENDED ? {
          where: {
            status: {
              in: ['CHECKED_OUT', 'OVERDUE']
            }
          },
          select: { id: true }
        } : undefined
      },
    });
    
    if (!existingMember) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }
    
    // If user is being suspended or deactivated, check for active transactions
    if ((status === UserStatus.INACTIVE || status === UserStatus.SUSPENDED) && 
        existingMember.transactions && existingMember.transactions.length > 0) {
      
      return NextResponse.json(
        { 
          error: `Cannot change status to ${status} while member has active transactions`,
          activeTransactions: existingMember.transactions.length
        },
        { status: 409 }
      );
    }
    
    // Update the member's status
    const updatedMember = await prisma.user.update({
      where: { id: memberId },
      data: {
        status,
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });
    
    // Log the status change for audit purposes
    await prisma.$executeRaw`
      INSERT INTO member_status_logs (member_id, previous_status, new_status, reason, changed_by)
      VALUES (${memberId}, ${existingMember.status}, ${status}, ${reason || null}, ${session.user.id})
    `.catch(error => {
      // If the table doesn't exist yet, we'll just log this (table to be created in future migration)
      console.warn("Could not log status change:", error);
    });
    
    return NextResponse.json({
      ...updatedMember,
      message: `Member status updated to ${status}`,
    });
  } catch (error) {
    console.error("Failed to update member status:", error);
    return NextResponse.json(
      { error: "Failed to update member status" },
      { status: 500 }
    );
  }
}
