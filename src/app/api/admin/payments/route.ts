import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit";
import {
  AdminCreatePaymentSchema,
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
    const validation = await parseAndValidateJson(request, AdminCreatePaymentSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { projectId, amount, currency, status, method, reference, transactionRef, notes } =
      validation.data;

    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { id: true, customerId: true, name: true },
    });

    if (!project) {
      return apiNotFound("Project not found.");
    }

    const payment = await prisma.payment.create({
      data: {
        projectId,
        recordedById: user.id,
        amount,
        currency,
        status,
        method,
        reference: reference || transactionRef,
        notes,
        paidAt: status === "paid" ? new Date() : undefined,
      },
      select: { id: true, amount: true, currency: true, status: true, paidAt: true },
    });

    await recordAudit({
      actorId: user.id,
      projectId,
      entityType: "payment",
      entityId: payment.id,
      action: "created",
      after: payment,
    });

    await prisma.notification.create({
      data: {
        userId: project.customerId,
        projectId,
        type: "payment",
        title: "Payment update",
        body: `A payment update was recorded for ${project.name}.`,
      },
    });

    return apiSuccess({ payment }, 201);
  } catch (error) {
    return apiInternalError(error, "Unable to record payment.");
  }
}
