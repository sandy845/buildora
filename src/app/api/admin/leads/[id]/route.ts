import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit";
import {
  AdminUpdateLeadSchema,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  parseAndValidateJson,
  requireAdminRoute,
} from "@/lib/api";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminRoute();
  if (!guard.authorized) {
    return guard.response;
  }
  const user = guard.user;
  const { id } = await params;

  try {
    const validation = await parseAndValidateJson(request, AdminUpdateLeadSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { status, notes } = validation.data;

    const before = await prisma.lead.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!before) {
      return apiNotFound("Lead not found.");
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(notes ? { notes } : {}),
        contactedAt: status && status !== "new" ? new Date() : undefined,
        closedAt: status === "closed" ? new Date() : undefined,
      },
      select: { id: true, status: true, contactedAt: true, closedAt: true },
    });

    await recordAudit({
      actorId: user.id,
      entityType: "lead",
      entityId: id,
      action: "status_changed",
      before,
      after: lead,
    });

    return apiSuccess({ lead });
  } catch (error) {
    return apiInternalError(error, "Unable to update lead.");
  }
}
