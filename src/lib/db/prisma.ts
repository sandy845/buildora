import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  buildoraPrisma?: PrismaClient;
};

const prismaClient =
  globalForPrisma.buildoraPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Preserve singleton across serverless container reuse in both dev and production
if (!globalForPrisma.buildoraPrisma) {
  globalForPrisma.buildoraPrisma = prismaClient;
}

// The existing API surface uses dynamic delegates; the runtime is a real Prisma client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: any = prismaClient;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PrismaTransactionClient = Record<string, any>;
