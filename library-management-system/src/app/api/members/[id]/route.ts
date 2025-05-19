import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Permission } from "@/lib/auth/rbac/types";
import { UserStatus } from "@prisma/client";

// Schema for validating member updates
const memberUpdateSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, {
      message: "Please enter a valid phone number.",
    })
    .optional()
    .or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  status: z.nativeEnum(UserStatus).optional(),
});

// GET endpoint to retrieve a specific member
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has permission to read users
    if (!session?.user?.permissions?.includes(Permission.USER_READ)) {
      return NextResponse.json(
        { error: "You don't have permission to view member details" },
        { status: 403 }
      );
    }

    const memberId = params.id;

    // Fetch detailed information about the member
    const member = await prisma.user.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        address: true,
        status: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Include borrowing history with pagination (most recent first)
        transactions: {
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
          },
          orderBy: {
            checkoutDate: "desc",
          },
          take: 10, // Limit to most recent 10 transactions
        },
        // Include reservation history with pagination (most recent first)
        reservations: {
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
          },
          orderBy: {
            reservationDate: "desc",
          },
          take: 10, // Limit to most recent 10 reservations
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Calculate activity metrics
    const activeTransactions = member.transactions.filter(t => 
      t.status === 'CHECKED_OUT' || t.status === 'OVERDUE'
    ).length;
    
    const activeReservations = member.reservations.filter(r => 
      r.status === 'PENDING' || r.status === 'READY_FOR_PICKUP'
    ).length;

    // Add activity summary to the response
    const memberWithMetrics = {
      ...member,
      activitySummary: {
        activeTransactions,
        activeReservations,
        totalTransactions: await prisma.transaction.count({ where: { userId: memberId } }),
        totalReservations: await prisma.reservation.count({ where: { userId: memberId } }),
      }
    };

    return NextResponse.json(memberWithMetrics);
  } catch (error) {
    console.error("Failed to fetch member details:", error);
    return NextResponse.json(
      { error: "Failed to fetch member details" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update a specific member
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has permission to update users
    if (!session?.user?.permissions?.includes(Permission.USER_UPDATE)) {
      return NextResponse.json(
        { error: "You don't have permission to update members" },
        { status: 403 }
      );
    }

    const memberId = params.id;
    const data = await request.json();
    
    // Validate the request data
    const validationResult = memberUpdateSchema.safeParse(data);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid data", 
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }
    
    // Check if the member exists
    const existingMember = await prisma.user.findUnique({
      where: { id: memberId },
      select: { id: true, role: true },
    });
    
    if (!existingMember) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }
    
    // Extract validated data
    const { name, phoneNumber, address, status } = validationResult.data;
    
    // Update the member
    const updatedMember = await prisma.user.update({
      where: { id: memberId },
      data: {
        ...(name && { name }),
        ...(phoneNumber !== undefined && { phoneNumber: phoneNumber || null }),
        ...(address !== undefined && { address: address || null }),
        ...(status && { status }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        address: true,
        status: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Failed to update member:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a member
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has permission to delete users
    if (!session?.user?.permissions?.includes(Permission.USER_DELETE)) {
      return NextResponse.json(
        { error: "You don't have permission to delete members" },
        { status: 403 }
      );
    }

    const memberId = params.id;
    
    // Check if the member exists
    const existingMember = await prisma.user.findUnique({
      where: { id: memberId },
      select: { 
        id: true,
        transactions: {
          where: {
            status: {
              in: ['CHECKED_OUT', 'OVERDUE']
            }
          },
          select: { id: true }
        }
      },
    });
    
    if (!existingMember) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }
    
    // Check if the member has active transactions
    if (existingMember.transactions.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete member with active transactions",
          activeTransactions: existingMember.transactions.length
        },
        { status: 409 }
      );
    }
    
    // Delete related records first (necessary for maintaining integrity)
    // Delete user role mappings
    await prisma.userRoleMapping.deleteMany({
      where: { userId: memberId }
    });
    
    // Delete password reset tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId: memberId }
    });
    
    // Instead of hard deletion, we'll use soft deletion by setting deletedAt
    const deletedMember = await prisma.user.update({
      where: { id: memberId },
      data: {
        status: UserStatus.INACTIVE,
        deletedAt: new Date(),
        email: `deleted-${memberId}-${new Date().getTime()}@deleted.com`, // Prevent email reuse
      },
    });
    
    return NextResponse.json(
      { success: true, message: "Member successfully deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete member:", error);
    return NextResponse.json(
      { error: "Failed to delete member" },
      { status: 500 }
    );
  }
}
