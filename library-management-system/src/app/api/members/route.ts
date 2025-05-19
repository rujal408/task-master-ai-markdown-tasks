import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Permission } from "@/lib/auth/rbac/types";
import { UserRole, UserStatus } from "@prisma/client";

// Schema for validating member creation
const memberCreateSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, {
      message: "Please enter a valid phone number.",
    })
    .optional()
    .or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

// Schema for filtering members
const memberFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.nativeEnum(UserStatus).optional(),
  sortBy: z.enum(['name', 'email', 'createdAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// GET endpoint to list all members with pagination, filtering, and sorting
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has permission to read users
    if (!session?.user?.permissions?.includes(Permission.USER_READ)) {
      return NextResponse.json(
        { error: "You don't have permission to view members" },
        { status: 403 }
      );
    }

    // Parse URL search params for filtering and pagination
    const searchParams = request.nextUrl.searchParams;
    const validatedParams = memberFilterSchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 10,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    const { page, limit, search, status, sortBy, sortOrder } = validatedParams;
    const skip = (page - 1) * limit;

    // Build the filter object for prisma query
    const where: any = {
      // Only return members (exclude admins, librarians)
      role: UserRole.MEMBER
    };

    // Add search filter if provided
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add status filter if provided
    if (status) {
      where.status = status;
    }

    // Get total count of members matching the filter
    const totalCount = await prisma.user.count({ where });

    // Get members with pagination, filtering, and sorting
    const members = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        address: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        // Include borrowing activity statistics
        transactions: {
          select: {
            id: true,
          },
          where: {
            status: {
              in: ['CHECKED_OUT', 'OVERDUE']
            }
          }
        },
        // Include reservation statistics
        reservations: {
          select: {
            id: true,
          },
          where: {
            status: {
              in: ['PENDING', 'READY_FOR_PICKUP']
            }
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Transform the results to include activity counts
    const transformedMembers = members.map(member => ({
      ...member,
      activeBorrowingsCount: member.transactions.length,
      activeReservationsCount: member.reservations.length,
      // Remove the raw relationship data
      transactions: undefined,
      reservations: undefined
    }));

    return NextResponse.json({
      members: transformedMembers,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    console.error("Failed to list members:", error);
    return NextResponse.json(
      { error: "Failed to list members" },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new member
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has permission to create users
    if (!session?.user?.permissions?.includes(Permission.USER_CREATE)) {
      return NextResponse.json(
        { error: "You don't have permission to create members" },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // Validate the request data
    const validationResult = memberCreateSchema.safeParse(data);
    
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
    const { email, name, phoneNumber, address, password } = validationResult.data;
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }
    
    // Hash the password
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create the new member
    const newMember = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        phoneNumber: phoneNumber || null,
        address: address || null,
        role: UserRole.MEMBER,
        status: UserStatus.ACTIVE,
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
      },
    });
    
    // Assign the MEMBER role in the role mapping table
    await prisma.userRoleMapping.create({
      data: {
        userId: newMember.id,
        role: UserRole.MEMBER,
      }
    });
    
    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error("Failed to create member:", error);
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 }
    );
  }
}
