import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit";
import {
  AdminCreateQuotationSchema,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  parseAndValidateJson,
  requireAdminRoute,
} from "@/lib/api";

export async function POST(request: NextRequest) {
  const guard = await requireAdminRoute();
  if (!guard.authorized) {
    return guard.response;
  }
  const user = guard.user;

  try {
    const validation = await parseAndValidateJson(request, AdminCreateQuotationSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { projectId, subtotal, tax = 0, total, notes, validUntil } = validation.data;
    const quotationNumber =
      validation.data.quotationNumber || `QT-${Date.now().toString().slice(-6)}`;

    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { id: true, customerId: true, name: true },
    });

    if (!project) {
      return apiNotFound("Project not found.");
    }

    const quotation = await prisma.quotation.create({
      data: {
        projectId,
        createdById: user.id,
        quotationNumber,
        subtotal,
        tax,
        total: total || subtotal + tax,
        status: "draft",
        notes,
        validUntil: validUntil ? new Date(validUntil) : undefined,
      },
      select: { id: true, quotationNumber: true, status: true, total: true },
    });

    await recordAudit({
      actorId: user.id,
      projectId,
      entityType: "quotation",
      entityId: quotation.id,
      action: "created",
      after: quotation,
    });

    await prisma.notification.create({
      data: {
        userId: project.customerId,
        projectId,
        type: "approval_required",
        title: "Quotation ready",
        body: `A new quotation is available for ${project.name}.`,
      },
    });

    return apiSuccess({ quotation }, 201);
  } catch (error) {
    return apiInternalError(error, "Unable to create quotation.");
  }
}
