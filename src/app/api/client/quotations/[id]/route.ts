import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit";
import { canAccessProject } from "@/lib/services/shared";
import {
  apiForbidden,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  ClientUpdateQuotationSchema,
  parseAndValidateJson,
  requireRouteUser,
} from "@/lib/api";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRouteUser();
  if (!guard.authorized) {
    return guard.response;
  }
  const user = guard.user;
  const { id } = await params;

  try {
    const validation = await parseAndValidateJson(request, ClientUpdateQuotationSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { status } = validation.data;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        status: true,
        project: { select: { customerId: true, name: true } },
      },
    });

    if (!quotation || !quotation.projectId || !quotation.project) {
      return apiNotFound("Quotation not found.");
    }

    if (!canAccessProject(user, quotation.project.customerId)) {
      return apiForbidden("You do not have permission to update this quotation.");
    }

    const updated = await prisma.quotation.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });

    await recordAudit({
      actorId: user.id,
      projectId: quotation.projectId,
      entityType: "quotation",
      entityId: id,
      action: `status_${status}`,
      before: { status: quotation.status },
      after: updated,
    });

    return apiSuccess({ quotation: updated });
  } catch (error) {
    return apiInternalError(error, "Unable to update quotation.");
  }
}
