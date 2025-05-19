import { NextRequest, NextResponse } from "next/server";
import { withRoleProtection } from "@/lib/auth/rbac/middleware";
import { Permission } from "@/lib/auth/rbac/types";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for validating book creation/update requests
const bookSchema = z.object({
  isbn: z.string().regex(/^(?:\d[- ]?){9}[\dXx]$/, {
    message: "ISBN must be a valid ISBN-10 format",
  }).or(z.string().regex(/^(?:\d[- ]?){13}[\dXx]$/, {
    message: "ISBN must be a valid ISBN-13 format",
  })),
  title: z.string().min(1, { message: "Title is required" }),
  author: z.string().min(1, { message: "Author is required" }),
  category: z.string().min(1, { message: "Category is required" }),
  edition: z.string().optional(),
  language: z.string().optional(),
  pageCount: z.number().int().positive().optional(),
  publishedYear: z.number().int().min(1000).max(new Date().getFullYear()).optional(),
  publisher: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().url().optional(),
});

// GET handler for fetching all books (requires BOOK_READ permission)
export async function GET(req: NextRequest) {
  return withRoleProtection(
    req,
    async (req, user) => {
      try {
        // Get pagination parameters from query string
        const searchParams = req.nextUrl.searchParams;
        const page = Number(searchParams.get("page") || "1");
        const pageSize = Number(searchParams.get("pageSize") || "10");
        const skip = (page - 1) * pageSize;
        
        // Apply search filter if provided
        const search = searchParams.get("search") || "";
        const filter = search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { author: { contains: search, mode: "insensitive" } },
                { isbn: { contains: search, mode: "insensitive" } },
                { category: { contains: search, mode: "insensitive" } },
              ],
              AND: { isDeleted: false },
            }
          : { isDeleted: false };
        
        // Get books with pagination
        const books = await prisma.book.findMany({
          where: filter as any,
          orderBy: { title: "asc" },
          skip,
          take: pageSize,
        });
        
        // Get total count for pagination
        const total = await prisma.book.count({ where: filter as any });
        
        // Return paginated results
        return NextResponse.json({
          books,
          pagination: {
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
            totalItems: total,
          },
        });
      } catch (error) {
        console.error("Error fetching books:", error);
        return NextResponse.json(
          { error: "Failed to fetch books" },
          { status: 500 }
        );
      }
    },
    {
      requireAuth: true,
      requiredPermissions: [Permission.BOOK_READ],
    }
  );
}

// POST handler for creating a new book (requires BOOK_CREATE permission)
export async function POST(req: NextRequest) {
  return withRoleProtection(
    req,
    async (req, user) => {
      try {
        const body = await req.json();
        
        // Validate request data
        const validationResult = bookSchema.safeParse(body);
        
        if (!validationResult.success) {
          return NextResponse.json(
            { 
              error: "Invalid data", 
              details: validationResult.error.format() 
            },
            { status: 400 }
          );
        }
        
        // Check if book with ISBN already exists
        const existingBook = await prisma.book.findUnique({
          where: { isbn: validationResult.data.isbn },
        });
        
        if (existingBook) {
          return NextResponse.json(
            { error: "Book with this ISBN already exists" },
            { status: 409 }
          );
        }
        
        // Create the book
        const book = await prisma.book.create({
          data: validationResult.data,
        });
        
        return NextResponse.json(book, { status: 201 });
      } catch (error) {
        console.error("Error creating book:", error);
        return NextResponse.json(
          { error: "Failed to create book" },
          { status: 500 }
        );
      }
    },
    {
      requireAuth: true,
      requiredPermissions: [Permission.BOOK_CREATE],
    }
  );
}
