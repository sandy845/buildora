import { firestoreCreate } from "@/lib/firebase/firestore";

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
    return await firestoreCreate("auditLogs", {
      actorId: input.actorId || null,
      projectId: input.projectId || null,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      before: input.before ?? null,
      after: input.after ?? null,
    });
  } catch (err) {
    console.warn("[audit] Failed to record audit log:", err);
    return null;
  }
}
