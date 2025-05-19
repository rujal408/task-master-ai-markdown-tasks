import { NextRequest, NextResponse } from "next/server";
import { withRoleProtection } from "@/lib/auth/rbac/middleware";
import { Permission } from "@/lib/auth/rbac/types";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for validating book updates
const bookUpdateSchema = z.object({
  isbn: z.string().regex(/^(?:\d[- ]?){9}[\dXx]$/, {
    message: "ISBN must be a valid ISBN-10 format",
  }).or(z.string().regex(/^(?:\d[- ]?){13}[\dXx]$/, {
    message: "ISBN must be a valid ISBN-13 format",
  })).optional(),
  title: z.string().min(1, { message: "Title is required" }).optional(),
  author: z.string().min(1, { message: "Author is required" }).optional(),
  category: z.string().min(1, { message: "Category is required" }).optional(),
  edition: z.string().optional(),
  language: z.string().optional(),
  pageCount: z.number().int().positive().optional(),
  publishedYear: z.number().int().min(1000).max(new Date().getFullYear()).optional(),
  publisher: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().url().optional(),
  status: z.enum(["AVAILABLE", "CHECKED_OUT", "RESERVED", "LOST", "DAMAGED", "UNDER_MAINTENANCE", "DISCARDED"]).optional(),
});

// GET handler for fetching a specific book by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRoleProtection(
    req,
    async (req, user) => {
      try {
        const { id } = params;
        
        // Fetch the book by ID
        const book = await prisma.book.findUnique({
          where: { id },
        });
        
        if (!book || book.isDeleted) {
          return NextResponse.json(
            { error: "Book not found" },
            { status: 404 }
          );
        }
        
        return NextResponse.json(book);
      } catch (error) {
        console.error("Error fetching book:", error);
        return NextResponse.json(
          { error: "Failed to fetch book" },
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

// PUT handler for updating a book by ID
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRoleProtection(
    req,
    async (req, user) => {
      try {
        const { id } = params;
        const body = await req.json();
        
        // Find the book first to ensure it exists
        const existingBook = await prisma.book.findUnique({
          where: { id },
        });
        
        if (!existingBook || existingBook.isDeleted) {
          return NextResponse.json(
            { error: "Book not found" },
            { status: 404 }
          );
        }
        
        // Validate request data
        const validationResult = bookUpdateSchema.safeParse(body);
        
        if (!validationResult.success) {
          return NextResponse.json(
            { 
              error: "Invalid data", 
              details: validationResult.error.format() 
            },
            { status: 400 }
          );
        }
        
        // If updating ISBN, check it doesn't conflict with another book
        if (validationResult.data.isbn && validationResult.data.isbn !== existingBook.isbn) {
          const bookWithSameIsbn = await prisma.book.findUnique({
            where: { isbn: validationResult.data.isbn },
          });
          
          if (bookWithSameIsbn && bookWithSameIsbn.id !== id) {
            return NextResponse.json(
              { error: "Book with this ISBN already exists" },
              { status: 409 }
            );
          }
        }
        
        // Update the book
        const updatedBook = await prisma.book.update({
          where: { id },
          data: validationResult.data,
        });
        
        return NextResponse.json(updatedBook);
      } catch (error) {
        console.error("Error updating book:", error);
        return NextResponse.json(
          { error: "Failed to update book" },
          { status: 500 }
        );
      }
    },
    {
      requireAuth: true,
      requiredPermissions: [Permission.BOOK_UPDATE],
    }
  );
}

// DELETE handler for soft-deleting a book by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRoleProtection(
    req,
    async (req, user) => {
      try {
        const { id } = params;
        
        // Find the book first to ensure it exists
        const existingBook = await prisma.book.findUnique({
          where: { id },
        });
        
        if (!existingBook || existingBook.isDeleted) {
          return NextResponse.json(
            { error: "Book not found" },
            { status: 404 }
          );
        }
        
        // Check if book can be deleted (no active transactions, etc.)
        const activeTransactions = await prisma.transaction.count({
          where: {
            bookId: id,
            status: {
              in: ["CHECKED_OUT", "OVERDUE"],
            },
          },
        });
        
        if (activeTransactions > 0) {
          return NextResponse.json(
            { error: "Cannot delete book with active transactions" },
            { status: 400 }
          );
        }
        
        // Soft delete the book
        const deletedBook = await prisma.book.update({
          where: { id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });
        
        return NextResponse.json(
          { message: "Book deleted successfully" },
          { status: 200 }
        );
      } catch (error) {
        console.error("Error deleting book:", error);
        return NextResponse.json(
          { error: "Failed to delete book" },
          { status: 500 }
        );
      }
    },
    {
      requireAuth: true,
      requiredPermissions: [Permission.BOOK_DELETE],
    }
  );
}
