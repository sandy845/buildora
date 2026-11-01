import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit";
import {
  AdminUpdateProjectSchema,
  apiError,
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
    const validation = await parseAndValidateJson(request, AdminUpdateProjectSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { targetCompletionDate, startDate, ...rest } = validation.data;
    const updateData: Record<string, unknown> = { ...rest };

    if (targetCompletionDate) {
      updateData.targetCompletionDate = new Date(targetCompletionDate);
    }
    if (startDate) {
      updateData.startDate = new Date(startDate);
    }

    if (Object.keys(updateData).length === 0) {
      return apiError("No valid project changes supplied.", 400);
    }

    const before = await prisma.project.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        location: true,
        status: true,
        progress: true,
        targetCompletionDate: true,
      },
    });

    if (!before) {
      return apiNotFound("Project not found.");
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, status: true, progress: true },
    });

    await recordAudit({
      actorId: user.id,
      projectId: id,
      entityType: "project",
      entityId: id,
      action: "updated",
      before,
      after: project,
    });

    return apiSuccess({ project });
  } catch (error) {
    return apiInternalError(error, "Unable to update project.");
  }
}
