// src/lib/prisma.ts

import { PrismaClient } from '@prisma/client'

// globalThis is a global object that survives hot reloads in development.
// Without this, every time you save a file in dev mode, Next.js reloads
// and creates a NEW PrismaClient — eventually exhausting database connections.
// Python equivalent: a module-level singleton — once imported, same object every time.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// If prisma already exists on globalThis, reuse it. If not, create a new one.
// The { log: ['query'] } makes Prisma print every SQL query to your terminal — useful for debugging.
// Python equivalent: db = existing_db if existing_db else create_new_db()
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] })

// In development only — save the prisma instance onto globalThis so hot reloads reuse it.
// In production this line never runs — Vercel creates one instance and keeps it alive.
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma