import { PrismaClient } from '@prisma/client'

// Add better error handling for Prisma initialization
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if we're in a production environment
const isProduction = process.env.NODE_ENV === 'production'

// Initialize PrismaClient with better error handling
function createPrismaClient() {
  try {
    return new PrismaClient({
      log: isProduction ? ['error'] : ['query', 'error', 'warn'],
    })
  } catch (error) {
    console.error('Failed to create Prisma client:', error)
    // In production, we might want to throw the error to fail fast
    // In development, we might want to return a mock client or null
    throw error
  }
}

// Use existing client if available, otherwise create a new one
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Save the client instance in development to prevent too many connections
if (!isProduction) globalForPrisma.prisma = prisma 