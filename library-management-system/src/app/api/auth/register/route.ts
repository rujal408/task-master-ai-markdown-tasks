import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { UserWithRoles } from "@/types/auth";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check password length
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create the user with the USER role (default)
    const user = await prisma.$transaction(async (tx) => {
      // Create the user with default USER role
      const newUser = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash: hashedPassword,
          status: UserStatus.ACTIVE,
          role: UserRole.USER,
        },
      });

      // Create the role mapping
      await tx.userRoleMapping.create({
        data: {
          userId: newUser.id,
          role: UserRole.USER,
        },
      });

      // Return the user with default role
      return {
        ...newUser,
        roles: [{ role: UserRole.USER }],
        userRoles: [{ role: UserRole.USER }]
      } as unknown as UserWithRoles;
    });

    // Create the response object that matches UserWithRoles type
    const responseUser = {
      id: user.id,
      name: user.name || '',
      email: user.email,
      status: user.status,
      // For backward compatibility
      role: UserRole.USER,
      // For role-based access control
      roles: user.roles || [{ role: UserRole.USER }],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    } as UserWithRoles;

    return NextResponse.json(
      { 
        user: responseUser,
        message: "User registered successfully" 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}
