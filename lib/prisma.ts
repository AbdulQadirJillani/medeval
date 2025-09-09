import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Singleton pattern to prevent multiple instances
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a single Prisma instance with proper configuration
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Add logging only in development to reduce overhead
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
    // Optimize error formatting
    errorFormat: 'minimal',
  }).$extends(withAccelerate());

// Prevent creating new instances in development
if (process.env.NODE_ENV !== 'production') {
  // @ts-expect-error: ignore it
  globalForPrisma.prisma = prisma;
}

export default prisma;
