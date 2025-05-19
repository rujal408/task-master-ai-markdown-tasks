import { PrismaClient, UserRole, UserStatus, BookStatus, Permission } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create roles
  const roles = [
    {
      name: UserRole.ADMIN,
      description: 'System administrator with full access',
      isSystem: true,
    },
    {
      name: UserRole.LIBRARIAN,
      description: 'Library staff with management capabilities',
      isSystem: true,
    },
    {
      name: UserRole.MEMBER,
      description: 'Library member with borrowing privileges',
      isSystem: true,
    },
    {
      name: UserRole.USER,
      description: 'Basic user with limited access',
      isSystem: true,
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@library.com' },
    update: {},
    create: {
      email: 'admin@library.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      status: UserStatus.ACTIVE,
      role: UserRole.ADMIN,
      userRoles: {
        create: {
          role: UserRole.ADMIN,
        },
      },
    },
  });

  // Create librarian
  const librarianPassword = await bcrypt.hash('librarian123', 10);
  const librarian = await prisma.user.upsert({
    where: { email: 'librarian@library.com' },
    update: {},
    create: {
      email: 'librarian@library.com',
      passwordHash: librarianPassword,
      name: 'Librarian User',
      status: UserStatus.ACTIVE,
      role: UserRole.LIBRARIAN,
      userRoles: {
        create: {
          role: UserRole.LIBRARIAN,
        },
      },
    },
  });

  // Create sample books
  const books = [
    {
      isbn: '978-3-16-148410-0',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      category: 'Fiction',
      edition: '1st',
      language: 'English',
      pageCount: 180,
      status: BookStatus.AVAILABLE,
      publishedYear: 1925,
      publisher: 'Scribner',
      description: 'A story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.',
      tags: ['classic', 'fiction', 'romance'],
    },
    {
      isbn: '978-0-7475-3269-9',
      title: 'Harry Potter and the Philosopher\'s Stone',
      author: 'J.K. Rowling',
      category: 'Fantasy',
      edition: '1st',
      language: 'English',
      pageCount: 309,
      status: BookStatus.AVAILABLE,
      publishedYear: 1997,
      publisher: 'Bloomsbury',
      description: 'The first book in the Harry Potter series.',
      tags: ['fantasy', 'magic', 'children'],
    },
    {
      isbn: '978-0-14-028333-4',
      title: '1984',
      author: 'George Orwell',
      category: 'Science Fiction',
      edition: '1st',
      language: 'English',
      pageCount: 328,
      status: BookStatus.AVAILABLE,
      publishedYear: 1949,
      publisher: 'Penguin Books',
      description: 'A dystopian social science fiction novel and cautionary tale.',
      tags: ['dystopian', 'science fiction', 'political'],
    },
  ];

  for (const book of books) {
    await prisma.book.upsert({
      where: { isbn: book.isbn },
      update: {},
      create: book,
    });
  }

  // Create role permissions
  const adminPermissions = Object.values(Permission);
  const librarianPermissions = [
    Permission.BOOK_CREATE,
    Permission.BOOK_READ,
    Permission.BOOK_UPDATE,
    Permission.TRANSACTION_CREATE,
    Permission.TRANSACTION_READ,
    Permission.TRANSACTION_UPDATE,
    Permission.RESERVATION_CREATE,
    Permission.RESERVATION_READ,
    Permission.RESERVATION_UPDATE,
    Permission.REPORT_VIEW,
  ];
  const memberPermissions = [
    Permission.BOOK_READ,
    Permission.TRANSACTION_READ,
    Permission.RESERVATION_CREATE,
    Permission.RESERVATION_READ,
  ];

  // Assign permissions to roles
  for (const permission of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_permission: {
          role: UserRole.ADMIN,
          permission,
        },
      },
      update: {},
      create: {
        role: UserRole.ADMIN,
        permission,
      },
    });
  }

  for (const permission of librarianPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_permission: {
          role: UserRole.LIBRARIAN,
          permission,
        },
      },
      update: {},
      create: {
        role: UserRole.LIBRARIAN,
        permission,
      },
    });
  }

  for (const permission of memberPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_permission: {
          role: UserRole.MEMBER,
          permission,
        },
      },
      update: {},
      create: {
        role: UserRole.MEMBER,
        permission,
      },
    });
  }

  console.log('Database has been seeded. 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 