import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

type AuditInput = {
  actorId?: string;
  projectId?: string;
  entityType: string;
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
};

export async function recordAudit(input: AuditInput) {
  try {
    return await prisma.auditLog.create({ data: {
      actorId: input.actorId || null,
      projectId: input.projectId || null,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      ...(input.before !== undefined && input.before !== null
        ? { before: JSON.parse(JSON.stringify(input.before)) as Prisma.InputJsonValue }
        : {}),
      ...(input.after !== undefined && input.after !== null
        ? { after: JSON.parse(JSON.stringify(input.after)) as Prisma.InputJsonValue }
        : {}),
    } });
  } catch (err) {
    console.warn("[audit] Failed to record audit log:", err);
    return null;
  }
}
