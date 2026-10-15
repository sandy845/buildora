import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  buildoraPrisma?: PrismaClient;
};

const prismaClient = globalForPrisma.buildoraPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.buildoraPrisma = prismaClient;
}

// The existing API surface uses dynamic delegates; the runtime is a real Prisma client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: any = prismaClient;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PrismaTransactionClient = Record<string, any>;
