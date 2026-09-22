import { PrismaClient } from "@prisma/client";

declare global {
  var buildoraPrisma: PrismaClient | undefined;
}

export const prisma = globalThis.buildoraPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.buildoraPrisma = prisma;
}
