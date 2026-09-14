import { PrismaClient } from "@prisma/client"

// Padrão recomendado pela própria Prisma para Next.js: reaproveitar a mesma instância
// do client entre hot-reloads em desenvolvimento, evitando abrir uma conexão nova a
// cada alteração de arquivo.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
