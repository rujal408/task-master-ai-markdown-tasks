import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Extend the Prisma Client to include our custom methods
declare module '@prisma/client' {
  const prisma: PrismaClient;
  export default prisma;
}

export {};
