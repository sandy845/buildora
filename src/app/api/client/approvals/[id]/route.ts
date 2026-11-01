import { NextRequest } from "next/server";
import { prisma, type PrismaTransactionClient } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit";
import { canAccessProject } from "@/lib/services/shared";
import {
  apiForbidden,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  ClientUpdateApprovalSchema,
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
    const validation = await parseAndValidateJson(request, ClientUpdateApprovalSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { status, comments } = validation.data;

    const approval = await prisma.approval.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        project: { select: { customerId: true, name: true } },
        status: true,
      },
    });

    if (!approval) {
      return apiNotFound("Approval request not found.");
    }

    if (!canAccessProject(user, approval.project.customerId)) {
      return apiForbidden("You do not have permission to review this approval.");
    }

    const updated = await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      const result = await tx.approval.update({
        where: { id },
        data: { status, comments, decidedAt: new Date() },
        select: { id: true, status: true, comments: true, decidedAt: true },
      });

      await tx.activityEvent.create({
        data: {
          projectId: approval.projectId,
          actorId: user.id,
          type: status === "approved" ? "approved" : "rejected",
          entityType: "approval",
          entityId: id,
          description: `Approval ${status} for ${approval.project.name}`,
        },
      });

      return result;
    });

    await recordAudit({
      actorId: user.id,
      projectId: approval.projectId,
      entityType: "approval",
      entityId: id,
      action: `status_${status}`,
      before: { status: approval.status },
      after: updated,
    });

    return apiSuccess({ approval: updated });
  } catch (error) {
    return apiInternalError(error, "Unable to update approval.");
  }
}
